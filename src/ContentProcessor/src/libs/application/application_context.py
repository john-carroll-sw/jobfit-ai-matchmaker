from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion

from libs.application.application_configuration import AppConfiguration
from libs.base.application_models import AppModelBase


class AppContext(AppModelBase):
    """
    This is Application Context Model.
    This object will be passed to all the classes which needs to access the application context.
    """

    configuration: AppConfiguration = None
    credential: DefaultAzureCredential = None
    kernel: Kernel = None

    def set_configuration(self, configuration: AppConfiguration):
        self.configuration = configuration

    def set_credential(self, credential: DefaultAzureCredential):
        self.credential = credential

    def set_kernel(self):
        kernel = Kernel()

        kernel.add_service(
            AzureChatCompletion(
                service_id="vision-agent",
                endpoint=self.configuration.app_azure_openai_endpoint,
                # api_key=self.app_config.azure_openai_key,
                ad_token_provider=get_bearer_token_provider(
                    DefaultAzureCredential(),
                    "https://cognitiveservices.azure.com/.default",
                ),
                deployment_name=self.configuration.app_azure_openai_model,
            )
        )

        self.kernel = kernel
