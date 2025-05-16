from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings


class CustomChatCompletionExecutionSettings(AzureChatPromptExecutionSettings):
    logprobs: bool = False
