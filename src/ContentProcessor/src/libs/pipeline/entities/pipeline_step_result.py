from typing import Any

from pydantic import Field

from libs.azure_helper.storage_blob import StorageBlobHelper
from libs.pipeline.entities.pipeline_message_base import PipelineMessageBase


class StepResult(PipelineMessageBase):
    process_id: str = Field(default=None)
    step_name: str = Field(default=None)
    result: Any = Field(default=None)
    elapsed: str = Field(default=None)

    def save_to_persistent_storage(self, account_url: str, container_name: str):
        if self.process_id is None:
            raise ValueError("Process ID is required to save the result.")

        StorageBlobHelper(
            account_url=account_url, container_name=container_name
        ).upload_text(
            container_name=self.process_id,
            blob_name=f"{self.step_name}-result.json",
            text=self.model_dump_json(),
        )
