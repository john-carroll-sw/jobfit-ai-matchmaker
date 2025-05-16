# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import os
import logging
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient


class StorageBlobHelper:
    def __init__(self, account_url, container_name=None):
        self.logger = logging.getLogger("StorageBlobHelper")
        self.logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
        if not self.logger.hasHandlers():
            self.logger.addHandler(handler)

        self.logger.info(f"Initializing StorageBlobHelper with account_url: {account_url}, container_name: {container_name}")
        # Log relevant environment variables (but not secrets)
        for var in ["AZURE_STORAGE_CONNECTION_STRING", "APP_STORAGE_BLOB_URL", "APP_STORAGE_QUEUE_URL", "AZURE_CLIENT_ID", "AZURE_TENANT_ID", "AZURE_CLIENT_SECRET"]:
            if os.getenv(var):
                if 'SECRET' in var or 'CONNECTION_STRING' in var:
                    self.logger.info(f"Env var {var} is set (value hidden)")
                else:
                    self.logger.info(f"Env var {var} = {os.getenv(var)}")
            else:
                self.logger.info(f"Env var {var} is not set") 

        credential = DefaultAzureCredential()
        # Try to get a token to see which credential is used
        try:
            token = credential.get_token("https://storage.azure.com/.default")
            self.logger.info(f"DefaultAzureCredential acquired token for: {token.token[:10]}... (token truncated)")
        except Exception as e:
            self.logger.error(f"DefaultAzureCredential failed to acquire token: {e}")
        self.blob_service_client = BlobServiceClient(
            account_url=account_url, credential=credential
        )
        self.parent_container_name = container_name
        if container_name:
            # if containeer_name is provided, "container_name/folder name" is used, get container_name
            # and create container if not exists
            container_name = container_name.split("/")[0]
            self._invalidate_container(container_name)

    def _get_container_client(self, container_name=None):
        if container_name:
            full_container_name = (
                f"{self.parent_container_name}/{container_name}"
                if self.parent_container_name
                else container_name
            )
        elif self.parent_container_name is not None and container_name is None:
            full_container_name = self.parent_container_name
        else:
            raise ValueError(
                "Container name must be provided either during initialization or as a function argument."
            )

        container_client = self.blob_service_client.get_container_client(
            full_container_name
        )

        return container_client

    def _invalidate_container(self, container_name: str):
        self.logger.info(f"Checking existence of container: {container_name}")
        container_client = self.blob_service_client.get_container_client(container_name)
        try:
            exists = container_client.exists()
            self.logger.info(f"container_client.exists() returned: {exists}")
        except Exception as e:
            self.logger.error(f"container_client.exists() raised exception: {e}")
            raise
        if not exists:
            self.logger.info(f"Container {container_name} does not exist. Creating container.")
            container_client.create_container()
        else:
            self.logger.info(f"Container {container_name} already exists.")

    def upload_blob(self, blob_name, file_stream, container_name=None):
        container_client = self._get_container_client(container_name)
        blob_client = container_client.get_blob_client(blob_name)
        result = blob_client.upload_blob(file_stream, overwrite=True)
        return result

    def download_blob(self, blob_name, container_name=None):
        container_client = self._get_container_client(container_name)
        blob_client = container_client.get_blob_client(blob_name)

        # Check if the blob exists
        try:
            blob_client.get_blob_properties()
        except Exception as e:
            raise ValueError(
                f"Blob '{blob_name}' not found in container '{container_name}'."
            ) from e

        # Check if the blob is empty
        blob_properties = blob_client.get_blob_properties()
        if blob_properties.size == 0:
            raise ValueError(f"Blob '{blob_name}' is empty.")

        download_stream = blob_client.download_blob()
        return download_stream.readall()

    def replace_blob(self, blob_name, file_stream, container_name=None):
        return self.upload_blob(blob_name, file_stream, container_name)

    def delete_blob(self, blob_name, container_name=None):
        container_client = self._get_container_client(container_name)
        blob_client = container_client.get_blob_client(blob_name)
        result = blob_client.delete_blob()
        return result

    def delete_blob_and_cleanup(self, blob_name, container_name=None):
        container_client = self._get_container_client(container_name)
        container_client.delete_blob(blob_name)

        # Check if the container is empty
        blobs = container_client.list_blobs()
        if not blobs._page_iterator:
            # Get Parent Container
            container_client = self._get_container_client()
            # Delete the (virtual) folder in the Container
            blob_client = container_client.get_blob_client(container_name)
            blob_client.delete_blob()

    def delete_folder(self, folder_name, container_name=None):
        container_client = self._get_container_client(container_name)

        # List all blobs inside the folder
        blobs_to_delete = container_client.list_blobs(name_starts_with=folder_name + "/")

        # Delete each blob
        for blob in blobs_to_delete:
            blob_client = container_client.get_blob_client(blob.name)
            blob_client.delete_blob()

        blobs_to_delete = container_client.list_blobs()
        if not blobs_to_delete:

            # Get Parent Container
            container_client = self._get_container_client()

            # Delete the (virtual) folder in the Container
            blob_client = container_client.get_blob_client(folder_name)
            blob_client.delete_blob()
