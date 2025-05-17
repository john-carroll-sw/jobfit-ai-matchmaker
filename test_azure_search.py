import os
import json
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from openai import AzureOpenAI
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex, SimpleField, SearchableField, VectorSearch, VectorSearchAlgorithmConfiguration, VectorField
)

# Load environment variables
load_dotenv()

# Azure OpenAI setup
aoai_endpoint = os.getenv("AZURE_OPENAI_EASTUS_ENDPOINT")
aoai_embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
aoai_api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2023-05-15")

# Azure AI Search setup
search_service_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
index_name = os.getenv("AZURE_SEARCH_INDEX")

token_provider = get_bearer_token_provider(DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default")

# Initialize clients
aoai_client = AzureOpenAI(
    azure_endpoint=aoai_endpoint,
    api_version=aoai_api_version,
    azure_ad_token_provider=token_provider,
)
search_client = SearchClient(
    endpoint=search_service_endpoint,
    index_name=index_name,
    credential=DefaultAzureCredential(),
)

def generate_embedding(text):
    response = aoai_client.embeddings.create(
        input=text,
        model=aoai_embedding_deployment
    )
    return response.data[0].embedding

def extract_resume_text(resume_data):
    """Extract searchable text from resume data for embedding"""
    parts = []
    
    # Add name
    if resume_data.get("full_name"):
        parts.append(f"Name: {resume_data['full_name']}")
    
    # Add summary
    if resume_data.get("summary"):
        parts.append(f"Summary: {resume_data['summary']}")
    
    # Add skills
    if resume_data.get("skills"):
        skills_text = ", ".join([skill["name"] for skill in resume_data["skills"] if skill.get("name")])
        parts.append(f"Skills: {skills_text}")
    
    # Add work experience
    if resume_data.get("work_experience"):
        for exp in resume_data["work_experience"]:
            exp_text = f"Position: {exp.get('job_title', '')} at {exp.get('employer', '')}"
            if exp.get('description'):
                exp_text += f" - {exp['description']}"
            parts.append(exp_text)
    
    # Add education
    if resume_data.get("education"):
        for edu in resume_data["education"]:
            parts.append(f"Education: {edu.get('degree', '')} from {edu.get('institution', '')}")
    
    # Add certifications
    if resume_data.get("certifications"):
        for cert in resume_data["certifications"]:
            parts.append(f"Certification: {cert.get('name', '')}")
    
    return "\n\n".join(parts)

def main():
    # Ensure the Azure Search index exists and matches the schema
    index_client = SearchIndexClient(endpoint=search_service_endpoint, credential=DefaultAzureCredential())
    vector_dimensions = 1536  # Adjust if your embedding model uses a different dimension
    index_schema = SearchIndex(
        name=index_name,
        fields=[
            SimpleField(name="id", type="Edm.String", key=True),
            SimpleField(name="document_type", type="Edm.String", filterable=True, facetable=True),
            SearchableField(name="name", type="Edm.String", filterable=False, sortable=True),
            SearchableField(name="summary", type="Edm.String", filterable=False),
            SearchableField(name="skills", type="Collection(Edm.String)", filterable=True, facetable=True),
            SearchableField(name="experience", type="Edm.String", filterable=False),
            SearchableField(name="education", type="Edm.String", filterable=False),
            VectorField(name="embedding", dimensions=vector_dimensions, vector_search_configuration="default")
        ],
        vector_search=VectorSearch(
            algorithm_configurations=[
                VectorSearchAlgorithmConfiguration(
                    name="default",
                    kind="hnsw",
                    parameters={"m":4, "efConstruction":400, "efSearch":500}
                )
            ]
        )
    )
    try:
        index_client.delete_index(index_name)
        print(f"Deleted existing index: {index_name}")
    except Exception as e:
        print(f"Index {index_name} does not exist or could not be deleted: {e}")
    index_client.create_or_update_index(index=index_schema)
    print(f"Created or updated index: {index_name}")
    
    # Load the sample resume JSON
    sample_path = "sample_resume.json"
    if not os.path.exists(sample_path):
        print(f"Error: {sample_path} not found")
        return
    
    with open(sample_path, "r") as f:
        doc = json.load(f)
    
    # Extract resume information
    resume_text = extract_resume_text(doc)
    resume_name = doc.get("full_name", "Anonymous Candidate")
    
    # Extract skills as a list of strings
    skills = [skill["name"] for skill in doc.get("skills", []) if skill.get("name")]
    
    # Format work experience
    work_exp_entries = []
    for exp in doc.get("work_experience", []):
        exp_text = f"{exp.get('job_title', '')} at {exp.get('employer', '')}"
        if exp.get('description'):
            exp_text += f": {exp['description']}"
        work_exp_entries.append(exp_text)
    work_experience_text = " | ".join(work_exp_entries)
    
    # Format education
    edu_entries = []
    for edu in doc.get("education", []):
        edu_text = f"{edu.get('degree', '')} from {edu.get('institution', '')}"
        edu_entries.append(edu_text)
    education_text = " | ".join(edu_entries)
    
    # Generate embedding for the resume
    print("Generating embedding for resume...")
    embedding = generate_embedding(resume_text)
    
    # Prepare document for Azure Search with document_type field
    search_doc = {
        "id": "resume_" + str(hash(resume_text) % 10000),  # Generate a unique ID
        "document_type": "resume",  # Tag indicating this is a resume
        "name": resume_name,
        "summary": doc.get("summary", ""),
        "skills": skills,
        "experience": work_experience_text,
        "education": education_text,
        "embedding": embedding
    }
    
    # Upload to Azure Search
    print("Uploading document to Azure AI Search...")
    result = search_client.upload_documents([search_doc])
    print(f"Upload result: {result[0].succeeded}")
    
    # Perform a vector search for healthcare assistant
    print("\nPerforming vector search for 'healthcare assistant'...")
    query_text = "healthcare assistant with experience in patient care"
    query_embedding = generate_embedding(query_text)
    
    vector_query = VectorizedQuery(vector=query_embedding, k_nearest_neighbors=3, fields="embedding")
    results = search_client.search(
        search_text=None,
        vector_queries=[vector_query],
        select=["id", "name", "summary", "skills", "experience"],
        filter="document_type eq 'resume'",  # Filter to only show resumes
        top=3
    )
    
    print("\nVector search results:")
    for res in results:
        print(f"\nResult: {res['name'] if res.get('name') else 'Unnamed'}")
        print(f"Score: {res.get('@search.score', 0)}")
        print(f"Summary: {res.get('summary', '')[:100]}...")
        print(f"Skills: {', '.join(res.get('skills', []))}")
        print(f"Experience: {res.get('experience', '')[:150]}...")

if __name__ == "__main__":
    main()