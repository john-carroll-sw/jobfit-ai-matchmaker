# Resume Embedding Pipeline

This document outlines the enhanced resume processing pipeline that includes vector embedding generation and indexing in Azure AI Search.

## Processing Steps

The content processing pipeline now includes the following steps:

1. **Extract** - Extract text and structure from the uploaded resume
2. **Map** - Map the extracted data to the resume schema
3. **Evaluate** - Evaluate and enhance the extracted data
4. **Embed** - Generate vector embeddings using Azure OpenAI
5. **Index** - Index the resume and its embeddings in Azure AI Search
6. **Save** - Save the processed data to Cosmos DB

## Vector Embeddings Process

### 1. Generating Embeddings

When a resume is processed, after the evaluation step, the embedding step:

1. Extracts key information from the structured resume data
2. Creates a consolidated text representation of the resume
3. Calls Azure OpenAI to generate embeddings using text-embedding-3-large
4. Stores the embeddings with the resume document

```python
def generate_embeddings(resume_data):
    """Generate vector embeddings for resume data"""
    # Prepare text for embedding
    text_sections = []
    
    # Add basic information
    if "personalInfo" in resume_data:
        text_sections.append(f"Name: {resume_data['personalInfo'].get('name', '')}")
    
    # Add summary
    if "summary" in resume_data:
        text_sections.append(f"Summary: {resume_data['summary']}")
    
    # Add skills
    if "skills" in resume_data:
        skills_text = ", ".join([skill["name"] for skill in resume_data["skills"]])
        text_sections.append(f"Skills: {skills_text}")
    
    # Add work experience
    if "workExperience" in resume_data:
        for experience in resume_data["workExperience"]:
            exp_text = (
                f"Position: {experience.get('title', '')} at {experience.get('company', '')}\n"
                f"Duration: {experience.get('startDate', '')} to {experience.get('endDate', '')}\n"
                f"Description: {experience.get('description', '')}"
            )
            text_sections.append(exp_text)
    
    # Add education
    if "education" in resume_data:
        for edu in resume_data["education"]:
            edu_text = (
                f"Degree: {edu.get('degree', '')} in {edu.get('fieldOfStudy', '')}\n"
                f"Institution: {edu.get('institution', '')}\n"
                f"Graduation: {edu.get('graduationDate', '')}"
            )
            text_sections.append(edu_text)
    
    # Combine all sections
    combined_text = "\n\n".join(text_sections)
    
    # Generate embedding using Azure OpenAI
    response = openai_client.embeddings.create(
        input=combined_text,
        model=config.EMBEDDING_MODEL
    )
    
    # Store embedding with the resume data
    resume_data["embedding"] = response.data[0].embedding
    
    return resume_data
```

### 2. Indexing in Azure AI Search

After embeddings are generated, the index step:

1. Creates or updates the search index schema if needed
2. Prepares the document for indexing
3. Uploads the document with embeddings to Azure AI Search

```python
def create_search_index():
    """Create the vector search index if it doesn't exist"""
    # Check if index exists
    if not search_client.get_index_names().get(config.SEARCH_INDEX_NAME):
        # Define the index schema
        index = SearchIndex(
            name=config.SEARCH_INDEX_NAME,
            fields=[
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
                    vector_search_dimensions=1536,  # For text-embedding-3-large
                    vector_search_profile_name="resume-profile"
                )
            ],
            vector_search=VectorSearch(
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
            ),
            semantic_search=SemanticSearch(
                configurations=[
                    SemanticConfiguration(
                        name="resume-semantic-config",
                        prioritized_fields=SemanticPrioritizedFields(
                            title_field=None,
                            keywords_fields=[
                                SemanticField(field_name="skills")
                            ],
                            content_fields=[
                                SemanticField(field_name="summary"),
                                SemanticField(field_name="experience"),
                                SemanticField(field_name="education")
                            ]
                        )
                    )
                ]
            )
        )
        
        # Create the index
        search_client.create_or_update_index(index)

def index_resume_in_search(resume_data):
    """Index resume data with embeddings in Azure AI Search"""
    # Ensure the index exists
    create_search_index()
    
    # Prepare the document for indexing
    search_document = {
        "id": resume_data["id"],
        "name": resume_data.get("personalInfo", {}).get("name", "Unknown"),
        "summary": resume_data.get("summary", ""),
        "skills": [skill["name"] for skill in resume_data.get("skills", [])],
        "experience": "\n".join([
            f"{exp.get('title', '')} at {exp.get('company', '')}: {exp.get('description', '')}"
            for exp in resume_data.get("workExperience", [])
        ]),
        "education": "\n".join([
            f"{edu.get('degree', '')} in {edu.get('fieldOfStudy', '')} from {edu.get('institution', '')}"
            for edu in resume_data.get("education", [])
        ]),
        "embedding": resume_data.get("embedding", [])
    }
    
    # Upload the document to the search index
    search_client.upload_documents([search_document])
    
    return True
```

## Using the Search Capabilities

Once resumes are indexed, you can perform various types of searches:

### 1. Keyword Search
```python
def keyword_search(query_text, top_k=5):
    """Perform keyword-based search"""
    results = search_client.search(
        search_text=query_text,
        select=["id", "name", "summary", "skills", "experience"],
        top=top_k
    )
    return list(results)
```

### 2. Vector Search
```python
def vector_search(query_text, top_k=5):
    """Perform vector search using embeddings"""
    # Generate embedding for query
    response = openai_client.embeddings.create(
        input=query_text,
        model=config.EMBEDDING_MODEL
    )
    query_vector = response.data[0].embedding
    
    # Create vector query
    vector = Vector(
        value=query_vector,
        k=top_k,
        fields="embedding"
    )
    
    # Execute search
    results = search_client.search(
        search_text=None,
        vectors=[vector],
        select=["id", "name", "summary", "skills", "experience"],
        top=top_k
    )
    return list(results)
```

### 3. Hybrid Search
```python
def hybrid_search(query_text, skills_filter=None, top_k=5):
    """Perform hybrid search (keywords + vectors)"""
    # Generate embedding for query
    response = openai_client.embeddings.create(
        input=query_text,
        model=config.EMBEDDING_MODEL
    )
    query_vector = response.data[0].embedding
    
    # Create vector query
    vector = Vector(
        value=query_vector,
        k=top_k,
        fields="embedding"
    )
    
    # Apply filters if specified
    filter_expr = None
    if skills_filter:
        filter_condition = " or ".join([f"skills/any(s: s eq '{skill}')" for skill in skills_filter])
        filter_expr = filter_condition
    
    # Execute hybrid search
    results = search_client.search(
        search_text=query_text,
        vectors=[vector],
        filter=filter_expr,
        select=["id", "name", "summary", "skills", "experience"],
        top=top_k,
        query_type="semantic",
        semantic_configuration_name="resume-semantic-config"
    )
    return list(results)
```

## Next Steps

1. Update the ContentProcessor to implement the embedding and indexing steps
2. Create API endpoints for searching resumes using Azure AI Search
3. Add job description to resume matching functionality
