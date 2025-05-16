# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import json
from typing import List, Optional
import uuid
from pydantic import Field

from libs.azure_helper.storage_blob import StorageBlobHelper
from libs.base.application_models import AppModelBase
from libs.pipeline.entities.mime_types import MimeTypesDetection
from libs.pipeline.entities.pipeline_file import ArtifactType, FileDetails
from libs.pipeline.entities.pipeline_status import PipelineStatus
from libs.pipeline.entities.pipeline_step_result import StepResult


class DataPipeline(AppModelBase):
    process_id: str
    pipeline_status: PipelineStatus = Field(
        default_factory=None, alias="PipelineStatus"
    )
    files: List[FileDetails] = Field(default_factory=list, alias="Files")

    @staticmethod
    def get_object(json_string: str) -> "DataPipeline":
        try:
            return DataPipeline(**json.loads(json_string))
            # return DataPipeline(**json_string)
        except Exception as e:
            raise ValueError(
                f"Failed to parse the json string to PipelineStatus object. {str(e)}"
            )

    def add_file(self, file_name: str, artifact_type: ArtifactType):
        """
        Save file to persistent storage with FileDetails
        """
        file = FileDetails(
            id=str(uuid.uuid4()),
            process_id=self.pipeline_status.process_id,
            name=file_name,
            mime_type=MimeTypesDetection.try_get_file_type(file_name),
            artifact_type=artifact_type,
            processed_by=self.pipeline_status.active_step,
        )

        self.files.append(file)
        return file

    def get_step_result(self, step_name: str) -> Optional["StepResult"]:
        """
        Get the StepResult for the given step_name
        """
        return self.pipeline_status.get_step_result(step_name)

    def get_previous_step_result(self, step_name: str) -> Optional["StepResult"]:
        """
        Get the StepResult for the previous step_name
        """
        return self.pipeline_status.get_previous_step_result(step_name)

    def get_source_files(self) -> List[FileDetails]:
        """
        Get the source files
        """
        return [
            file
            for file in self.files
            if file.artifact_type == ArtifactType.SourceContent
        ]

    def save_to_persistent_storage(self, account_url: str, container_name: str):
        self.pipeline_status.update_step()

        StorageBlobHelper(
            account_url=account_url, container_name=container_name
        ).upload_text(
            container_name=self.pipeline_status.process_id,
            blob_name="process-status.json",
            text=self.model_dump_json(),
        )

    def save_to_database(self):
        raise NotImplementedError("Method not implemented")
