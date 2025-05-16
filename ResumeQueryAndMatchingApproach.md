# Querying Resumes & Building a Job Description Matching System

Based on your existing architecture where resume data is processed and stored in Azure Cosmos DB and Blob Storage, here's how to effectively query this data and build a resume-job matching system:

## Querying Your Resume Data

Since your data is in Azure Cosmos DB (for structured data) and Azure Blob Storage (for original files), you have several powerful options:

### 1. **Azure Cosmos DB Queries**

```python
# Basic query to get all resumes
query = "SELECT * FROM c WHERE c.schemaType = 'Resume'"

# Query for specific skills
skills_query = """
SELECT * FROM c 
WHERE c.schemaType = 'Resume' 
AND ARRAY_CONTAINS(c.skills, { "name": "Python", "proficiency": "Expert" }, true)
"""

# Query for healthcare professionals
healthcare_query = """
SELECT * FROM c 
WHERE c.schemaType = 'Resume' 
AND IS_DEFINED(c.healthcare_extension)
AND ARRAY_CONTAINS(c.healthcare_extension.medical_specialties, 'Cardiology', true)
"""
```

### 2. **Advanced Azure Cognitive Search**

For more powerful semantic search:

1. Create an Azure Cognitive Search index from your Cosmos DB collection
2. Configure semantic search capabilities
3. Query using natural language:

```python
# Using Azure Cognitive Search Python SDK
search_client.search(
    search_text="experienced healthcare professionals with EMR implementation",
    select="id,personal_info,professional_summary",
    semantic_configuration_name="resume-semantic-config"
)
```

## Building a Job-Resume Matching System

For your proof of concept matching resumes to job descriptions, I recommend this approach:

### 1. **Vector-Based Matching with Azure OpenAI Embeddings**

```python
from openai import AzureOpenAI
import numpy as np

# Initialize Azure OpenAI client
client = AzureOpenAI(
    api_key="your-api-key",  
    api_version="2023-05-15",
    azure_endpoint="https://your-resource.openai.azure.com"
)

def create_embedding(text):
    """Generate embeddings for text using Azure OpenAI."""
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"  # Or your deployed embedding model
    )
    return response.data[0].embedding

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Pre-compute and store embeddings for all resumes in your database
# This could be a batch process that runs periodically

def match_job_to_resumes(job_description, top_n=10):
    """Match job description to resumes and return top matches."""
    # Create embedding for job description
    job_embedding = create_embedding(job_description)
    
    # Query your database for resume embeddings
    # This assumes you've stored embeddings with your resume documents
    resumes = query_resume_embeddings_from_cosmos()
    
    # Calculate similarity scores
    matches = []
    for resume in resumes:
        resume_embedding = resume['embedding']
        score = cosine_similarity(job_embedding, resume_embedding)
        matches.append({
            'resume_id': resume['id'],
            'score': score,
            'name': resume['personal_info']['first_name'] + ' ' + resume['personal_info']['last_name']
        })
    
    # Return top N matches
    top_matches = sorted(matches, key=lambda x: x['score'], reverse=True)[:top_n]
    return top_matches
```

### 2. **Enhanced Hybrid Approach**

For better results, combine vector search with keyword matching and filtered queries:

```python
def enhanced_match_job_to_resumes(job_description, filters=None):
    """Match job to resumes with filters for required skills/experience."""
    # Extract key requirements from job description using Azure OpenAI
    requirements = extract_job_requirements(job_description)
    
    # Build a filtered query for hard requirements
    filter_conditions = []
    if 'required_years_experience' in requirements:
        min_years = requirements['required_years_experience']
        # Filter for candidates with sufficient experience
        filter_conditions.append(f"c.total_experience_years >= {min_years}")
    
    if 'required_skills' in requirements:
        for skill in requirements['required_skills']:
            # Filter for candidates with required skills
            filter_conditions.append(f"ARRAY_CONTAINS(c.skills, {{name: '{skill}'}}, true)")
    
    # Combine filters
    filter_query = " AND ".join(filter_conditions) if filter_conditions else None
    
    # Get candidates matching hard requirements
    candidate_resumes = query_filtered_resumes(filter_query)
    
    # Then do semantic matching on this filtered set
    return match_job_to_resumes_semantic(job_description, candidate_resumes)
```

### 3. **Leveraging Azure AI Search (formerly Cognitive Search)**

```python
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

# Initialize search client
search_client = SearchClient(
    endpoint="https://your-search-service.search.windows.net",
    index_name="resumes",
    credential=AzureKeyCredential("your-search-api-key")
)

def semantic_job_match(job_description):
    """Use semantic search to find matching resumes."""
    results = search_client.search(
        search_text=job_description,
        select="id,name,skills,experience,education",
        semantic_configuration_name="resume-matching-config", 
        top=10
    )
    
    matches = []
    for result in results:
        matches.append({
            'id': result['id'],
            'name': result['name'],
            'score': result['@search.score'],
            # Additional fields
        })
    
    return matches
```

## Next Steps for Your Proof of Concept

1. **Create an embedding pipeline** to compute and store vectors for all resumes
2. **Build a job parser** that extracts key requirements from job descriptions
3. **Implement a scoring system** that balances:
   - Skills match (required vs. nice-to-have)
   - Experience relevance
   - Education requirements
   - Industry-specific qualifications (like healthcare credentials)
4. **Add a simple UI** for job matching that displays top candidates with match reasoning

Would you like me to elaborate on any specific aspect of this approach for your proof of concept?