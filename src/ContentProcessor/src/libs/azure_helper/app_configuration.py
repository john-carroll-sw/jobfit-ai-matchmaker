import os
import logging
from azure.appconfiguration import AzureAppConfigurationClient
from azure.identity import DefaultAzureCredential


class AppConfigurationHelper:
    credential: DefaultAzureCredential = None
    app_config_endpoint: str = None
    app_config_client: AzureAppConfigurationClient = None

    def __init__(self, app_config_endpoint: str):
        self.logger = logging.getLogger("AppConfigurationHelper")
        self.logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
        if not self.logger.hasHandlers():
            self.logger.addHandler(handler)
        self.logger.info(f"Initializing AppConfigurationHelper with endpoint: {app_config_endpoint}")
        self.credential = DefaultAzureCredential()
        self.app_config_endpoint = app_config_endpoint
        self._initialize_client()

    def _initialize_client(self):
        if self.app_config_endpoint is None:
            self.logger.error("App Configuration Endpoint is not set.")
            raise ValueError("App Configuration Endpoint is not set.")
        try:
            self.app_config_client = AzureAppConfigurationClient(
                self.app_config_endpoint, self.credential
            )
            self.logger.info("AzureAppConfigurationClient initialized successfully.")
        except Exception as e:
            self.logger.error(f"Failed to initialize AzureAppConfigurationClient: {e}")
            raise

    def read_configuration(self):
        try:
            settings = list(self.app_config_client.list_configuration_settings())
            self.logger.info(f"Fetched {len(settings)} configuration settings from App Configuration.")
            for item in settings:
                self.logger.info(f"Fetched key: {item.key}")
            return settings
        except Exception as e:
            self.logger.error(f"Error fetching configuration settings: {e}")
            raise

    def read_and_set_environmental_variables(self):
        try:
            for item in self.read_configuration():
                os.environ[item.key] = item.value
                self.logger.info(f"Set environment variable: {item.key}")
            return os.environ
        except Exception as e:
            self.logger.error(f"Error setting environment variables from App Configuration: {e}")
            raise
