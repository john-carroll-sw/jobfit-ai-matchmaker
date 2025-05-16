# jobfit-ai-matchmaker

**AI-powered proof of concept for matching resumes to job descriptions using semantic and hybrid search.**

## Overview

This project is a focused proof of concept (POC) for intelligent resume-to-job matching, leveraging document ingestion and extraction pipelines from the [Microsoft content-processing-solution-accelerator](https://github.com/microsoft/content-processing-solution-accelerator).

- Ingests and processes resumes using Azure AI and OpenAI services.
- Stores structured resume data for efficient querying and matching.
- Implements semantic and hybrid search to match job descriptions to top candidate resumes.

## Key Features

- **Document Ingestion:** Utilizes the robust ingestion, extraction, and schema mapping pipeline from the Microsoft accelerator.
- **Resume Schema:** Extensible Pydantic schema for resumes, supporting industry-specific fields.
- **Semantic Matching:** Uses Azure OpenAI embeddings and/or Azure Cognitive Search for job-to-resume matching.
- **Hybrid Filtering:** Combines hard filters (skills, experience) with semantic similarity for best results.

## Getting Started

1. Clone this repo.
2. Follow the setup instructions in the [content-processing-solution-accelerator](https://github.com/microsoft/content-processing-solution-accelerator) for ingestion and schema registration.
3. Use the provided scripts and notebooks to run job-to-resume matching experiments.

## Status

This is an early-stage POC and IP exploration. Contributions and feedback are welcome!
