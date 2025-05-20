import os
import json
from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.models import VectorizedQuery
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchField,
    SearchFieldDataType,
    VectorSearch,
    VectorSearchAlgorithmConfiguration,
    HnswAlgorithmConfiguration,
    VectorSearchProfile,
    AzureOpenAIVectorizer,
    AzureOpenAIVectorizerParameters,
    SemanticConfiguration,
    SemanticPrioritizedFields,
    SemanticField,
    SemanticSearch
)

# Load environment variables
load_dotenv()

# Azure OpenAI setup
aoai_endpoint = os.getenv("AZURE_OPENAI_EASTUS_ENDPOINT")
aoai_embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
aoai_api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")

# Azure AI Search setup
search_service_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
index_name = os.getenv("AZURE_SEARCH_INDEX")

# Initialize clients
credential = DefaultAzureCredential()

token_provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")

# Azure OpenAI client
aoai_client = AzureOpenAI(
    azure_endpoint=aoai_endpoint,
    api_version=aoai_api_version,
    azure_ad_token_provider=token_provider,
)

# Azure Search client
search_client = SearchClient(
    endpoint=search_service_endpoint,
    index_name=index_name,
    credential=credential,
)

index_client = SearchIndexClient(
    endpoint=search_service_endpoint, 
    index_name=index_name,
    credential=credential
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

def create_or_update_index():
    """Create or update the Azure Search index with the specified schema"""
    # Ensure the Azure Search index exists and matches the schema
    index_schema = SearchIndex(
        name=index_name,
        fields=[
            SimpleField(name="id", type="Edm.String", key=True),
            SimpleField(name="document_type", type="Edm.String", filterable=True, facetable=True),
            SearchField(name="name", type="Edm.String", filterable=False, sortable=True),
            SearchField(name="summary", type="Edm.String", filterable=False),
            SearchField(name="skills", type="Collection(Edm.String)", filterable=True, facetable=True),
            SearchField(name="experience", type="Edm.String", filterable=False),
            SearchField(name="education", type="Edm.String", filterable=False),
            SearchField(
                name="embedding", 
                type="Collection(Edm.Single)", 
                vector_search_dimensions=3072,  # Adjust if your embedding model uses a different dimension
                vector_search_profile_name="hnswProfile"
            )
        ],
        vector_search=VectorSearch(
            algorithms=[
                HnswAlgorithmConfiguration(
                    name="hnsw",
                    kind="hnsw",
                    parameters={
                        "m": 10,  # Adjusted for accuracy/memory trade-off
                        "efConstruction": 200  # Ensures recall during indexing
                    }
                )
            ],
            profiles=[
                VectorSearchProfile(
                    name="hnswProfile",
                    algorithm_configuration_name="hnsw",
                    vectorizer_name="vectorizer"
                )
            ],
            vectorizers=[
                AzureOpenAIVectorizer(
                    vectorizer_name="vectorizer",
                    parameters=AzureOpenAIVectorizerParameters(
                        resource_url=aoai_endpoint,
                        deployment_name=aoai_embedding_deployment,
                        model_name=aoai_embedding_deployment
                        # No api_key for AAD auth
                    )
                )
            ],
        ),
        semantic_search=SemanticSearch(
            configurations=[    
                SemanticConfiguration(
                    name="semanticConfig",
                    prioritized_fields=SemanticPrioritizedFields(
                        title_field=SemanticField(field_name="name"),  # Prioritize the "name" (e.g., "Espresso")
                        content_fields=[
                            SemanticField(field_name="summary"),  # Primary content field
                            SemanticField(field_name="experience"),  # Provide detailed context
                            SemanticField(field_name="education")  # Assist in grouping similar items
                        ],
                        keywords_fields=[
                            SemanticField(field_name="skills")  # Keywords for semantic search
                        ]
                    )
                )
            ]
        )
    )
    # try:
    #     index_client.delete_index(index_name)
    #     print(f"Deleted existing index: {index_name}")
    # except Exception as e:
    #     print(f"Index {index_name} does not exist or could not be deleted: {e}")
    index_client.create_or_update_index(index=index_schema)
    print(f"Created or updated index: {index_name}")
    
def index_all_resumes():
    """Index all resumes from the 'resumes' folder into Azure AI Search"""
    resumes_dir = "resumes"
    if not os.path.exists(resumes_dir):
        print(f"Error: {resumes_dir} folder not found")
        return
    files = [f for f in os.listdir(resumes_dir) if f.endswith('.json')]
    if not files:
        print(f"No JSON files found in {resumes_dir}")
        return
    docs_to_upload = []
    for file_name in files:
        file_path = os.path.join(resumes_dir, file_name)
        with open(file_path, "r") as f:
            doc = json.load(f)
        # Extract resume information
        resume_text = extract_resume_text(doc)
        resume_name = doc.get("full_name", "Anonymous Candidate")
        # Extract skills as a list of strings
        skills = [skill["name"] if isinstance(skill["name"], str) else skill["name"].get("value", "") for skill in doc.get("skills", []) if skill.get("name")]
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
        print(f"Generating embedding for {file_name}...")
        embedding = generate_embedding(resume_text)
        # Prepare document for Azure Search with document_type field
        search_doc = {
            "id": file_name.replace('.json', ''),
            "document_type": "resume",
            "name": resume_name,
            "summary": doc.get("summary", ""),
            "skills": skills,
            "experience": work_experience_text,
            "education": education_text,
            "embedding": embedding
        }
        docs_to_upload.append(search_doc)
    # Upload all documents in batches (Azure Search supports up to 1000 per batch)
    print(f"Uploading {len(docs_to_upload)} documents to Azure AI Search...")
    result = search_client.upload_documents(docs_to_upload)
    print(f"Upload results: {[r.succeeded for r in result]}")

def main():
    # Ensure the Azure Search index exists and matches the schema
    create_or_update_index()

    # Index all resumes from the resumes folder
    index_all_resumes()
    
if __name__ == "__main__":
    main()