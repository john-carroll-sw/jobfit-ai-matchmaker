# Integrating Azure AI Search Embeddings into JobFit AI Matchmaker

Based on your codebase and the ResumeQueryAndMatchingApproach.md document, I've identified several places where you can enhance the Content Processing API to support embeddings generation and Azure AI Search integration.

## Key Integration Points

I can see your ContentProcessorAPI already has a robust pipeline with Extract, Mapping, Evaluating, and Save steps. Here's how to integrate embeddings and search capabilities:

### 1. Add Embedding Generation Step to Pipeline

```python
class Steps(str, Enum):
    Extract = "Extract"
    Mapping = "Mapping"
    Evaluating = "Evaluating"
    Embedding = "Embedding"  # New step for generating embeddings
    SearchIndex = "SearchIndex"  # New step for Azure Search index updates
    Save = "Save"
```

### 2. Update the Content Pipeline Status in Submit Endpoint

```python
# Update the submit function to include new steps

# Create Message Object to be sent to Queue
submit_queue_message = ContentProcess(
    **{
        "process_id": process_id,
        "files": [
            ProcessFile(
                **{
                    "process_id": process_id,
                    "id": str(uuid.uuid4()),
                    "name": file.filename,
                    "size": file.size,
                    "mime_type": file.content_type,
                    "artifact_type": ArtifactType.SourceContent,
                    "processed_by": "API",
                }
            ),
        ],
        "pipeline_status": Status(
            **{
                "process_id": process_id,
                "schema_id": data.Schema_Id,
                "metadata_id": data.Metadata_Id,
                "creation_time": datetime.datetime.now(datetime.timezone.utc),
                "steps": [
                    Steps.Extract,
                    Steps.Mapping,
                    Steps.Evaluating,
                    Steps.Embedding,  # Add Embedding step
                    Steps.SearchIndex,  # Add SearchIndex step
                    Steps.Save,
                ],
                "remaining_steps": [
                    Steps.Extract,
                    Steps.Mapping,
                    Steps.Evaluating,
                    Steps.Embedding,  # Add Embedding step
                    Steps.SearchIndex,  # Add SearchIndex step
                    Steps.Save,
                ],
                "completed_steps": [],
            }
        ),
    }
)
```

### 3. Create an Embedding Handler

Create a new embedding handler class to generate embeddings using Azure OpenAI:

```python
import os
import numpy as np
from openai import AzureOpenAI
from typing import Dict, Any, List

class AzureOpenAIEmbedder:
    """Handler for generating embeddings using Azure OpenAI"""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the embedder with configuration"""
        self.api_key = config.get("api_key") or os.environ.get("AZURE_OPENAI_KEY")
        self.api_version = config.get("api_version") or "2023-05-15"
        self.azure_endpoint = config.get("azure_endpoint") or os.environ.get("AZURE_OPENAI_ENDPOINT")
        self.embedding_model = config.get("embedding_model") or "atext-embedding-3-large"
        
        # Initialize Azure OpenAI client
        self.client = AzureOpenAI(
            api_key=self.api_key,
            api_version=self.api_version,
            azure_endpoint=self.azure_endpoint
        )
    
    def create_embedding(self, text: str) -> List[float]:
        """Generate embeddings for text using Azure OpenAI"""
        response = self.client.embeddings.create(
            input=text,
            model=self.embedding_model
        )
        return response.data[0].embedding
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the data and generate embeddings"""
        # Extract resume information to create a consolidated text
        consolidated_text = self._create_text_for_embedding(data)
        
        # Generate embedding
        embedding = self.create_embedding(consolidated_text)
        
        # Add embedding to the data
        data["embedding"] = embedding
        
        return data
    
    def _create_text_for_embedding(self, data: Dict[str, Any]) -> str:
        """Create consolidated text from resume data for embedding"""
        texts = []
        
        # Personal info
        if "personal_info" in data:
            personal_info = data["personal_info"]
            texts.append(f"{personal_info.get('name', '')}")
            
        # Summary
        if "professional_summary" in data:
            texts.append(data["professional_summary"])
            
        # Skills
        if "skills" in data:
            skills_text = ", ".join([skill["name"] for skill in data["skills"]])
            texts.append(f"Skills: {skills_text}")
            
        # Work experience
        if "work_experience" in data:
            for exp in data["work_experience"]:
                exp_text = f"{exp.get('title', '')} at {exp.get('company', '')}: {exp.get('description', '')}"
                texts.append(exp_text)
                
        # Education
        if "education" in data:
            for edu in data["education"]:
                edu_text = f"{edu.get('degree', '')} in {edu.get('field_of_study', '')} from {edu.get('institution', '')}"
                texts.append(edu_text)
        
        # Join all text parts
        return " ".join(texts)
```

### 4. Create a Search Index Handler

```python
import os
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SearchField,
    SearchFieldDataType,
    SimpleField,
    SearchableField,
    VectorSearch,
    VectorSearchProfile,
    HnswAlgorithmConfiguration,
    VectorSearchAlgorithmKind,
    VectorSearchAlgorithmMetric,
)
from typing import Dict, Any, List

class AzureSearchIndexer:
    """Handler for indexing documents in Azure AI Search"""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the search indexer with configuration"""
        self.search_service = config.get("search_service") or os.environ.get("SEARCH_SERVICE_NAME")
        self.search_key = config.get("search_key") or os.environ.get("SEARCH_API_KEY")
        self.index_name = config.get("search_index") or "resumes-index"
        self.endpoint = f"https://{self.search_service}.search.windows.net"
        
        # Initialize Azure Search clients
        self.index_client = SearchIndexClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.search_key)
        )
        
        self.search_client = SearchClient(
            endpoint=self.endpoint,
            index_name=self.index_name,
            credential=AzureKeyCredential(self.search_key)
        )
        
        # Ensure the search index exists
        self._ensure_index_exists()
    
    def _ensure_index_exists(self):
        """Create the search index if it doesn't exist"""
        if not self.index_client.get_index_names().get(self.index_name):
            # Define fields
            fields = [
                SimpleField(name="id", type=SearchFieldDataType.String, key=True),
                SearchableField(name="name", type=SearchFieldDataType.String),
                SearchableField(name="summary", type=SearchFieldDataType.String),
                SearchableField(name="skills", type=SearchFieldDataType.Collection(SearchFieldDataType.String)),
                SearchableField(name="experience", type=SearchFieldDataType.String),
                SearchableField(name="education", type=SearchFieldDataType.String),
                SearchField(
                    name="embedding", 
                    type=SearchFieldDataType.Collection(SearchFieldDataType.Single), 
                    searchable=True, 
                    vector_search_dimensions=1536,  # For atext-embedding-3-large model
                    vector_search_profile_name="resume-profile"
                )
            ]
            
            # Define vector search configurations
            vector_search = VectorSearch(
                profiles=[
                    VectorSearchProfile(
                        name="resume-profile",
                        algorithm_configuration_name="resume-algorithm"
                    )
                ],
                algorithms=[
                    HnswAlgorithmConfiguration(
                        name="resume-algorithm",
                        kind=VectorSearchAlgorithmKind.HNSW,
                        parameters={
                            "m": 4,
                            "efConstruction": 400,
                            "efSearch": 500,
                            "metric": VectorSearchAlgorithmMetric.COSINE
                        }
                    )
                ]
            )
            
            # Create the index
            index = SearchIndex(
                name=self.index_name,
                fields=fields,
                vector_search=vector_search,
                semantic_search=None  # Can be configured for semantic search
            )
            
            self.index_client.create_or_update_index(index)
    
    def index_document(self, doc_id: str, document: Dict[str, Any]) -> bool:
        """Index a document in Azure AI Search"""
        try:
            search_document = self._transform_document(doc_id, document)
            self.search_client.upload_documents([search_document])
            return True
        except Exception as e:
            print(f"Error indexing document: {e}")
            return False
    
    def _transform_document(self, doc_id: str, document: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a document to a format suitable for indexing"""
        # Extract necessary fields from the document
        personal_info = document.get("personal_info", {})
        name = f"{personal_info.get('first_name', '')} {personal_info.get('last_name', '')}"
        
        # Extract skills as a list of strings
        skills = [skill["name"] for skill in document.get("skills", [])]
        
        # Combine work experiences into a single string
        experience_entries = []
        for exp in document.get("work_experience", []):
            experience_entries.append(
                f"{exp.get('title', '')} at {exp.get('company', '')}, {exp.get('duration', '')}: {exp.get('description', '')}"
            )
        experience = " | ".join(experience_entries)
        
        # Combine education into a single string
        education_entries = []
        for edu in document.get("education", []):
            education_entries.append(
                f"{edu.get('degree', '')} in {edu.get('field_of_study', '')} from {edu.get('institution', '')}"
            )
        education = " | ".join(education_entries)
        
        # Create the search document
        search_document = {
            "id": doc_id,
            "name": name,
            "summary": document.get("professional_summary", ""),
            "skills": skills,
            "experience": experience,
            "education": education,
            "embedding": document.get("embedding", [])
        }
        
        return search_document
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the document and index it in Azure AI Search"""
        # Check if document has process_id and embedding
        process_id = data.get("process_id")
        if process_id and "embedding" in data:
            # Index the document
            success = self.index_document(process_id, data)
            data["search_indexed"] = success
        
        return data
```

### 5. Create New API Endpoints for Matching and Search

Add these endpoints to the ContentProcessorAPI to support searching resumes and matching jobs to resumes:

```python
from fastapi import APIRouter, Depends, Body
from fastapi.responses import JSONResponse
from typing import List, Optional

from app.appsettings import AppConfiguration, get_app_config
from openai import AzureOpenAI
import numpy as np
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import Vector
import os

router = APIRouter(
    prefix="/search",
    tags=["search"],
    responses={404: {"description": "Not found"}},
)

class ResumeSearcher:
    def __init__(self, app_config: AppConfiguration):
        # Initialize Azure OpenAI client for embeddings
        self.openai_client = AzureOpenAI(
            api_key=app_config.app_openai_key,
            api_version="2023-05-15",
            azure_endpoint=app_config.app_openai_endpoint
        )
        
        # Initialize Azure Search client
        search_endpoint = f"https://{app_config.app_search_service}.search.windows.net"
        self.search_client = SearchClient(
            endpoint=search_endpoint,
            index_name=app_config.app_search_index,
            credential=AzureKeyCredential(app_config.app_search_key)
        )
        
        # Store configuration
        self.embedding_model = app_config.app_openai_embedding_deployment
    
    def create_embedding(self, text: str):
        """Generate embeddings for text using Azure OpenAI"""
        response = self.openai_client.embeddings.create(
            input=text,
            model=self.embedding_model
        )
        return response.data[0].embedding
    
    def semantic_search(self, query_text: str, top_k: int = 5):
        """Perform semantic search using Azure AI Search"""
        results = self.search_client.search(
            search_text=query_text,
            select=["id", "name", "summary", "skills", "experience", "education"],
            top=top_k,
            query_type="semantic",
            semantic_configuration_name="resume-semantic-config"
        )
        
        return list(results)
    
    def vector_search(self, query_text: str, top_k: int = 5):
        """Perform vector search using Azure AI Search"""
        # Generate embedding for the query
        query_embedding = self.create_embedding(query_text)
        
        # Create the vector search
        vector = Vector(value=query_embedding, k=top_k, fields="embedding")
        
        # Perform vector search
        results = self.search_client.search(
            search_text=None,
            vectors=[vector],
            select=["id", "name", "summary", "skills", "experience", "education"],
            top=top_k
        )
        
        return list(results)
    
    def hybrid_search(self, query_text: str, top_k: int = 5, filters: Optional[str] = None):
        """Perform hybrid search (keyword + vector) using Azure AI Search"""
        # Generate embedding for the query
        query_embedding = self.create_embedding(query_text)
        
        # Create the vector search
        vector = Vector(value=query_embedding, k=top_k, fields="embedding")
        
        # Perform hybrid search
        results = self.search_client.search(
            search_text=query_text,
            vectors=[vector],
            select=["id", "name", "summary", "skills", "experience", "education"],
            filter=filters,
            top=top_k
        )
        
        return list(results)

@router.get(
    "/resumes",
    summary="Search for resumes using text query",
    description="Search for resumes using semantic search in Azure AI Search",
)
async def search_resumes(
    query: str,
    top_k: int = 5,
    app_config: AppConfiguration = Depends(get_app_config),
):
    searcher = ResumeSearcher(app_config)
    results = searcher.semantic_search(query, top_k)
    
    return {
        "query": query,
        "results": results
    }

@router.post(
    "/resumes/vector",
    summary="Search for resumes using vector embedding search",
    description="Search for resumes using vector embeddings in Azure AI Search",
)
async def vector_search_resumes(
    query: str,
    top_k: int = 5,
    app_config: AppConfiguration = Depends(get_app_config),
):
    searcher = ResumeSearcher(app_config)
    results = searcher.vector_search(query, top_k)
    
    return {
        "query": query,
        "results": results
    }

@router.post(
    "/match-job",
    summary="Match a job description to resumes",
    description="Match a job description to resumes using hybrid search",
)
async def match_job_to_resumes(
    job_description: str = Body(..., embed=True),
    required_skills: List[str] = Body(default=[]),
    required_years: Optional[int] = Body(default=None),
    top_k: int = Body(default=5),
    app_config: AppConfiguration = Depends(get_app_config),
):
    searcher = ResumeSearcher(app_config)
    
    # Build filter if required skills or experience are specified
    filters = []
    if required_skills:
        skill_filters = [f"skills/any(s: s eq '{skill}')" for skill in required_skills]
        filters.append(f"({' or '.join(skill_filters)})")
    
    if required_years is not None:
        filters.append(f"total_experience ge {required_years}")
    
    filter_query = " and ".join(filters) if filters else None
    
    # Perform hybrid search
    results = searcher.hybrid_search(job_description, top_k, filter_query)
    
    return {
        "job_description": job_description,
        "filters": {
            "required_skills": required_skills,
            "required_years": required_years
        },
        "matches": results
    }
```

### 6. Update AppConfiguration to Support New Features 

```python
# Add these fields to your AppConfiguration class

class AppConfiguration:
    # Existing configuration
    # ...
    
    # Azure OpenAI Configuration
    app_openai_key: str = os.environ.get("AZURE_OPENAI_KEY", "")
    app_openai_endpoint: str = os.environ.get("AZURE_OPENAI_ENDPOINT", "")
    app_openai_embedding_deployment: str = os.environ.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "atext-embedding-3-large")
    app_openai_gpt_deployment: str = os.environ.get("AZURE_OPENAI_GPT_DEPLOYMENT", "gpt-35-turbo")
    
    # Azure Search Configuration
    app_search_service: str = os.environ.get("SEARCH_SERVICE_NAME", "")
    app_search_key: str = os.environ.get("SEARCH_API_KEY", "")
    app_search_index: str = os.environ.get("SEARCH_INDEX_NAME", "resumes-index")
```

### 7. Add the New Router to main.py

```python
# Include the new search router

from app.routers import contentprocessor, search

# ...

app.include_router(contentprocessor.router)
app.include_router(search.router)
```

## Best Practices for Azure Integration

When implementing this solution:

1. **Use managed identities** instead of API keys when possible
2. **Store secrets in Azure Key Vault** rather than environment variables
3. **Enable monitoring** with Azure Application Insights
4. **Use Azure Function App** for scaling the embedding generation process
5. **Set up indexer refresh logic** to keep your search index updated
6. **Consider semantic ranking profiles** to improve search results quality

This implementation follows the approaches outlined in your ResumeQueryAndMatchingApproach.md file, providing a complete solution for matching job descriptions to resumes using Azure OpenAI embeddings and Azure AI Search.