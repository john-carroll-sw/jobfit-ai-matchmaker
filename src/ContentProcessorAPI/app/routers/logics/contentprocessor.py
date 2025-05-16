# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from pydantic import BaseModel, Field

from app.appsettings import AppConfiguration, get_app_config
from app.libs.storage_blob.helper import StorageBlobHelper
from app.libs.storage_queue.helper import StorageQueueHelper


class ContentProcessor(BaseModel):
    config: AppConfiguration = Field(default=None)
    blobHelper: StorageBlobHelper = Field(default=None)
    queueHelper: StorageQueueHelper = Field(default=None)

    def __init__(self):
        super().__init__()
        self.config = get_app_config()
        self.blobHelper = StorageBlobHelper(
            self.config.app_storage_blob_url, self.config.app_cps_processes
        )
        self.queueHelper = StorageQueueHelper(
            self.config.app_storage_queue_url, self.config.app_message_queue_extract
        )

    def save_file_to_blob(self, process_id: str, file: bytes, file_name: str):
        self.blobHelper.upload_blob(file_name, file, process_id)

    def enqueue_message(self, message_object: BaseModel):
        self.queueHelper.drop_message(message_object)

    class Config:
        arbitrary_types_allowed = True


coontent_processor = ContentProcessor()


def get_content_processor() -> ContentProcessor:
    return coontent_processor
