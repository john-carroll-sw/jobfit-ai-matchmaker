from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI


# It will be deprecated in the future
# Open AI SDK -> Semaantic Kernel
def get_openai_client(azure_openai_endpoint: str) -> AzureOpenAI:
    credential = DefaultAzureCredential()
    token_provider = get_bearer_token_provider(
        credential, "https://cognitiveservices.azure.com/.default"
    )
    return AzureOpenAI(
        azure_endpoint=azure_openai_endpoint,
        azure_ad_token_provider=token_provider,
        api_version="2024-10-21",
    )
