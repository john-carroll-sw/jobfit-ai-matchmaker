import os
import json
from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.models import VectorizedQuery

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

def perform_vector_search(query_text, top=5):

    # Perform a vector search for healthcare assistant
    print(f"\nPerforming vector search for '{query_text}'...")
    query_embedding = generate_embedding(query_text)
    
    vector_query = VectorizedQuery(vector=query_embedding, k_nearest_neighbors=top, fields="embedding")
    return search_client.search(
        search_text=None,
        vector_queries=[vector_query],
        select=["id", "name", "summary", "skills", "experience"],
        filter="document_type eq 'resume'",  # Filter to only show resumes
        top=top
    )

def perform_hybrid_search(query_text, top=5):
    # Perform a hybrid search for healthcare assistant
    print(f"\nPerforming hybrid search for '{query_text}'...")
    query_embedding = generate_embedding(query_text)
    
    vector_query = VectorizedQuery(vector=query_embedding, k_nearest_neighbors=top, fields="embedding")
    return search_client.search(
        search_text=query_text,
        query_type="semantic",
        semantic_configuration_name="semanticConfig",
        vector_queries=[vector_query],
        select=["id", "name", "summary", "skills", "experience"],
        filter="document_type eq 'resume'",  # Filter to only show resumes
        top=top
    )

def main():
    query_text = "healthcare assistant with experience in patient care"
    
    # results = perform_vector_search(query_text)
    results = perform_hybrid_search(query_text)
    
    print("\nSearch results:")
    for res in results:
        print(f"\nResult id: {res['id'] if res.get('id') else 'No ID'}")
        print(f"Name: {res.get('name', 'Unnamed')}")
        print(f"Score: {res.get('@search.score', 0)}")
        print(f"Semantic Score: {res.get('@search.reranker_score', 0)}")
        # print(f"Reranker Score: {res['@search.reranker_score'] if '@search.reranker_score' in res else 'N/A'}")
        print(f"Summary: {res.get('summary', '')[:100]}...")
        print(f"Skills: {', '.join(res.get('skills', []))}")
        print(f"Experience: {res.get('experience', '')[:150]}...")
        

if __name__ == "__main__":
    main()