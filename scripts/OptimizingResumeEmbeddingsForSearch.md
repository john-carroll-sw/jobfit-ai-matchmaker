# Optimizing Resume Embeddings for Azure AI Search

This document outlines best practices for structuring resume data in Azure AI Search, particularly when working with embeddings for semantic search.

## Challenges with Single Embeddings

When indexing resumes with complex schemas, several challenges arise:

1. **Token Limits**: Azure OpenAI embedding models have token limits:
   - text-embedding-3-large (3072 dimensions): 8191 token limit
   - text-embedding-ada-002 (1536 dimensions): 8191 token limit

2. **Information Dilution**: When too much diverse information is packed into a single embedding vector, semantic meaning gets diluted.

3. **Retrieval Precision**: Overpacked embeddings lead to fuzzy matches rather than precise ones.

4. **Context Relevance**: Different parts of a resume are relevant in different search contexts.

## Multi-Vector Approach (Recommended)

### Best Practice: Use a Hybrid Index with Multiple Embeddings

```python
# Create a hybrid search index with both vector and structured fields
index_schema = SearchIndex(
    name=index_name,
    fields=[
        # Core identity fields
        SimpleField(name="id", type="Edm.String", key=True),
        SimpleField(name="resume_type", type="Edm.String", filterable=True),
        
        # Structured searchable fields (for traditional search)
        SearchField(name="full_name", type="Edm.String", searchable=True),
        SearchableField(name="summary", type="Edm.String"),
        
        # Skills as a collection field (for filtering and facets)
        SearchField(name="skills", type="Collection(Edm.String)", 
                   filterable=True, facetable=True),
        
        # Industry-specific fields as collections
        SearchField(name="specialties", type="Collection(Edm.String)", 
                   filterable=True, facetable=True),
        SearchField(name="certifications", type="Collection(Edm.String)", 
                   filterable=True, facetable=True),
        
        # Nested content as searchable fields
        SearchField(name="work_experience", type="Edm.String"),
        SearchField(name="education", type="Edm.String"),
        
        # Multiple targeted embeddings 
        SearchField(
            name="skills_embedding", 
            type="Collection(Edm.Single)",
            vector_search_dimensions=3072,
            vector_search_profile_name="semantic_profile"
        ),
        SearchField(
            name="experience_embedding", 
            type="Collection(Edm.Single)",
            vector_search_dimensions=3072,
            vector_search_profile_name="semantic_profile"
        ),
        SearchField(
            name="full_resume_embedding", 
            type="Collection(Edm.Single)",
            vector_search_dimensions=3072,
            vector_search_profile_name="semantic_profile"
        )
    ],
    # Vector search configuration similar to current setup
    # ...
)
```

### Specialized Text Extraction Functions

Create specific extraction functions for each embedding type:

```python
def extract_skills_text(resume_data):
    """Extract text focused on skills for embedding"""
    parts = []
    
    # Add skills with level and categories
    if resume_data.get("skills"):
        for skill in resume_data["skills"]:
            skill_text = f"{skill.get('name', '')}"
            if skill.get('level'):
                skill_text += f" (Level: {skill['level']})"
            if skill.get('category'):
                skill_text += f" - Category: {skill['category']}"
            parts.append(skill_text)
    
    # Add languages as skills
    if resume_data.get("languages"):
        for lang in resume_data["languages"]:
            parts.append(f"Language: {lang.get('language', '')} - {lang.get('proficiency', '')}")
    
    # Include industry-specific skills
    if resume_data.get("healthcare"):
        healthcare = resume_data["healthcare"]
        if healthcare.get("emr_systems"):
            parts.append(f"EMR Systems: {', '.join(healthcare['emr_systems'])}")
        if healthcare.get("specialties"):
            parts.append(f"Medical Specialties: {', '.join(healthcare['specialties'])}")
    
    return "\n".join(parts)

def extract_experience_text(resume_data):
    """Extract text focused on work experience for embedding"""
    parts = []
    
    # Extract detailed work experience
    if resume_data.get("work_experience"):
        for exp in resume_data["work_experience"]:
            parts.append(f"Position: {exp.get('job_title', '')} at {exp.get('employer', '')}")
            parts.append(f"Duration: {exp.get('start_date', '')} to {exp.get('end_date', '')}")
            if exp.get("location"):
                parts.append(f"Location: {exp['location']}")
            if exp.get("industry"):
                parts.append(f"Industry: {exp['industry']}")
            if exp.get("description"):
                parts.append(f"Description: {exp['description']}")
            parts.append("---")  # Separator between entries
    
    return "\n".join(parts)

def extract_resume_text(resume_data, max_tokens=4000):
    """Extract abbreviated but comprehensive resume text for general embedding"""
    parts = []
    
    if resume_data.get("full_name"):
        parts.append(f"Name: {resume_data['full_name']}")
    
    if resume_data.get("summary"):
        parts.append(f"Summary: {resume_data['summary']}")
    
    # Abbreviated skills (just names)
    if resume_data.get("skills"):
        skills_text = ", ".join([skill["name"] for skill in resume_data["skills"] if skill.get("name")])
        parts.append(f"Skills: {skills_text}")
    
    # Abbreviated work experience
    if resume_data.get("work_experience"):
        for exp in resume_data["work_experience"]:
            parts.append(f"Position: {exp.get('job_title', '')} at {exp.get('employer', '')}")
            if exp.get('description'):
                # Truncate description if needed
                desc = exp['description']
                parts.append(desc[:300] + "..." if len(desc) > 300 else desc)
    
    # Abbreviated education
    if resume_data.get("education"):
        edu_parts = []
        for edu in resume_data["education"]:
            edu_parts.append(f"{edu.get('degree', '')} from {edu.get('institution', '')}")
        parts.append(f"Education: {', '.join(edu_parts)}")
    
    # Important certifications
    if resume_data.get("certifications"):
        cert_parts = [cert.get('name', '') for cert in resume_data["certifications"]]
        parts.append(f"Certifications: {', '.join(cert_parts)}")
    
    # TODO: Implement token counting to ensure we stay under max_tokens
    
    return "\n\n".join(parts)
```

### Index Implementation

```python
def index_resume(resume_data, resume_id):
    """Index a resume with multiple specialized embeddings"""
    
    # Generate specialized embeddings
    skills_text = extract_skills_text(resume_data)  
    skills_embedding = generate_embedding(skills_text)
    
    experience_text = extract_experience_text(resume_data)
    experience_embedding = generate_embedding(experience_text)
    
    # Abbreviated full resume text (most important parts only)
    resume_text = extract_resume_text(resume_data, max_tokens=4000)
    full_resume_embedding = generate_embedding(resume_text)
    
    # Extract structured fields
    resume_name = resume_data.get("full_name", "Anonymous Candidate")
    
    # Extract skills as a list of strings
    skills = [skill["name"] for skill in resume_data.get("skills", []) if skill.get("name")]
    
    # Format work experience
    work_exp_entries = []
    for exp in resume_data.get("work_experience", []):
        exp_text = f"{exp.get('job_title', '')} at {exp.get('employer', '')}"
        if exp.get('description'):
            exp_text += f": {exp['description']}"
        work_exp_entries.append(exp_text)
    work_experience_text = " | ".join(work_exp_entries)
    
    # Format education
    edu_entries = []
    for edu in resume_data.get("education", []):
        edu_text = f"{edu.get('degree', '')} from {edu.get('institution', '')}"
        edu_entries.append(edu_text)
    education_text = " | ".join(edu_entries)
    
    # Extract industry-specific fields
    industry_fields = extract_industry_fields(resume_data)
    
    # Create document with multiple embeddings
    search_doc = {
        "id": resume_id,
        "resume_type": "resume",
        "full_name": resume_name,
        "summary": resume_data.get("summary", ""),
        "skills": skills,
        "specialties": industry_fields.get("specialties", []),
        "certifications": [cert.get("name", "") for cert in resume_data.get("certifications", [])],
        "work_experience": work_experience_text,
        "education": education_text,
        
        # Multiple targeted embeddings
        "skills_embedding": skills_embedding,
        "experience_embedding": experience_embedding,
        "full_resume_embedding": full_resume_embedding
    }
    
    return search_doc

def extract_industry_fields(resume_data):
    """Extract industry-specific fields from resume"""
    industry_fields = {}
    
    # Extract healthcare-specific fields
    if resume_data.get("healthcare"):
        healthcare = resume_data["healthcare"]
        industry_fields.update({
            "specialties": healthcare.get("specialties", []),
            "board_certifications": healthcare.get("board_certifications", []),
            "emr_systems": healthcare.get("emr_systems", []),
            "patient_populations": healthcare.get("patient_populations", [])
        })
    
    # Handle other industries from extensions
    if resume_data.get("industry_extensions"):
        for industry, data in resume_data["industry_extensions"].items():
            # Add additional industry-specific processing here
            pass
    
    return industry_fields
```

## Search Implementation

When implementing search against this multi-vector structure:

```python
def search_resumes(job_description, industry=None, focus_area=None):
    """
    Search resumes with job description, optional industry filter, and optional focus area
    
    Args:
        job_description: The job description text
        industry: Optional industry filter (e.g., "healthcare", "technology")
        focus_area: Optional focus area ("skills", "experience", or None for full resume)
    """
    # Generate embedding for the job description
    job_embedding = generate_embedding(job_description)
    
    # Build search options
    search_options = {
        "select": ["id", "full_name", "summary", "skills", "work_experience"],
        "filter": "resume_type eq 'resume'"
    }
    
    # Add industry filter if specified
    if industry:
        search_options["filter"] += f" and specialties/any(s: s eq '{industry}')"
    
    # Choose which embedding field to search against based on focus
    if focus_area == "skills":
        vector_field = "skills_embedding"
    elif focus_area == "experience":
        vector_field = "experience_embedding"
    else:
        vector_field = "full_resume_embedding"
    
    # Set up vector query
    vector_query = VectorizedQuery(
        vector=job_embedding,
        k_nearest_neighbors=50,
        fields=[vector_field]
    )
    
    # Execute hybrid search
    results = search_client.search(
        search_text=None,  # Can use text too for hybrid search
        vector_queries=[vector_query],
        **search_options
    )
    
    return results
```

## Advanced Multi-Vector Search

For more sophisticated matching, you can use multiple vectors simultaneously:

```python
def advanced_resume_search(
    job_description, 
    industry=None, 
    skills_weight=0.5, 
    experience_weight=0.3, 
    general_weight=0.2
):
    """
    Advanced resume search using multiple vectors with weights
    """
    # Generate job description embedding
    job_embedding = generate_embedding(job_description)
    
    # Create three vector queries with weights
    vector_queries = [
        VectorizedQuery(
            vector=job_embedding,
            k_nearest_neighbors=100,
            fields=["skills_embedding"],
            weight=skills_weight
        ),
        VectorizedQuery(
            vector=job_embedding,
            k_nearest_neighbors=100, 
            fields=["experience_embedding"],
            weight=experience_weight
        ),
        VectorizedQuery(
            vector=job_embedding,
            k_nearest_neighbors=100,
            fields=["full_resume_embedding"],
            weight=general_weight
        )
    ]
    
    # Build search options
    search_options = {
        "select": ["id", "full_name", "summary", "skills", "work_experience"],
        "filter": "resume_type eq 'resume'"
    }
    
    # Add industry filter if specified
    if industry:
        search_options["filter"] += f" and specialties/any(s: s eq '{industry}')"
    
    # Execute multi-vector hybrid search
    results = search_client.search(
        search_text=None,
        vector_queries=vector_queries,
        **search_options
    )
    
    return results
```

## Key Recommendations

1. **Segment your embeddings**: Don't try to pack everything into one vector
2. **Keep structured fields**: Use Azure AI Search's strength in hybrid search
3. **Reduce token counts**: For full resume embeddings, focus on the most important aspects
4. **Use filtering**: Leverage the structured fields for pre-filtering before vector search
5. **Implement cross-field matching**: Use semantic rankers to improve results

## Next Steps

1. Implement a token counting function to ensure embeddings stay under model limits
2. Develop industry-specific extractors for different resume types
3. Create specialized search endpoints for different matching scenarios
4. Consider implementing configurable weighting between vector fields
5. Evaluate performance across different embedding models (text-embedding-3-large vs text-embedding-ada-002)

By implementing these practices, you'll achieve much more precise matching between jobs and resumes while maintaining the rich structure of your resume data.
