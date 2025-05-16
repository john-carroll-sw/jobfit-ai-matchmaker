# Resume Querying & Job Matching Proof of Concept

## 1. Querying Resumes in Azure Cosmos DB

- Use SQL-like queries to filter resumes by schema type, skills, or industry extensions.
- Example queries:

```sql
-- All resumes
SELECT * FROM c WHERE c.schemaType = 'Resume'

-- Resumes with Python skill
SELECT * FROM c WHERE c.schemaType = 'Resume' AND ARRAY_CONTAINS(c.skills, { "name": "Python" }, true)

-- Healthcare professionals
SELECT * FROM c WHERE c.schemaType = 'Resume' AND IS_DEFINED(c.healthcare_extension)
```

- For more advanced search, index your Cosmos DB collection in Azure Cognitive Search for semantic and full-text queries.

## 2. Building a Job Description to Resume Matching System

### a. Vector-Based Semantic Matching

- Use Azure OpenAI to generate embeddings for both job descriptions and resumes.
- Store resume embeddings in Cosmos DB.
- For a new job description:
  1. Generate its embedding.
  2. Compute cosine similarity with all stored resume embeddings.
  3. Return top N matches.

#### Example (Python pseudocode)

```python
from openai import AzureOpenAI
import numpy as np

def create_embedding(text):
    # Call Azure OpenAI embedding endpoint
    ...

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Precompute and store resume embeddings
# For matching:
job_emb = create_embedding(job_description)
for resume in resumes:
    score = cosine_similarity(job_emb, resume['embedding'])
# Sort and select top N
```

### b. Hybrid Filtering + Semantic Search

- Extract hard requirements (skills, experience) from job description using Azure OpenAI.
- Filter resumes in Cosmos DB for these requirements.
- Then apply semantic similarity on the filtered set.

### c. Using Azure Cognitive Search

- Index resumes in Azure Cognitive Search.
- Use semantic search with the job description as the query.
- Retrieve top matches with explanations.

## 3. Next Steps

- Build an embedding pipeline for resumes.
- Implement job description parsing for requirements.
- Combine filtering and semantic scoring for best results.
- Optionally, add a UI to display top matches and match explanations.

---

**References:**

- [Azure Cosmos DB SQL Queries](https://learn.microsoft.com/azure/cosmos-db/nosql/query/select)
- [Azure Cognitive Search](https://learn.microsoft.com/azure/search/)
- [Azure OpenAI Embeddings](https://learn.microsoft.com/azure/ai-services/openai/how-to/embeddings)

This document summarizes the recommended approach for querying resumes and building a job-to-resume matching proof of concept in your Azure-based solution.
