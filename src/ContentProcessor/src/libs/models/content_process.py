# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import datetime
from typing import Any, Optional

from pydantic import BaseModel, SkipValidation

from libs.azure_helper.comsos_mongo import CosmosMongDBHelper
from libs.pipeline.entities.schema import Schema
from libs.pipeline.handlers.logics.evaluate_handler.comparison import (
    ExtractionComparisonData,
)


class Step_Outputs(BaseModel):
    step_name: str
    processed_time: Optional[str] = None
    step_result: SkipValidation[Any]

    class Config:
        arbitrary_types_allowed = True


class ContentProcess(BaseModel):
    process_id: str
    processed_file_name: Optional[str] = None
    processed_file_mime_type: Optional[str] = None
    processed_time: Optional[str] = None
    imported_time: datetime.datetime = datetime.datetime.now(datetime.UTC)
    last_modified_time: datetime.datetime = datetime.datetime.now(datetime.UTC)
    last_modified_by: Optional[str] = None
    status: str
    entity_score: Optional[float] = 0.0
    min_extracted_entity_score: Optional[float] = 0.0
    schema_score: Optional[float] = 0.0
    result: Optional[dict] = None
    confidence: Optional[dict] = None
    target_schema: Optional[Schema] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0

    process_output: list[Step_Outputs] = []
    extracted_comparison_data: Optional[ExtractionComparisonData] = None

    comment: Optional[str] = None

    def update_process_status_to_cosmos(
        self,
        connection_string: str,
        database_name: str,
        collection_name: str,
    ):
        """
        Update the status of the process in Cosmos DB.
        """
        # Check if the process_id is already in the database
        mongo_helper = CosmosMongDBHelper(
            connection_string=connection_string,
            db_name=database_name,
            container_name=collection_name,
            indexes=["process_id"],
        )

        # Check if the process_id already exists in the database
        existing_process = mongo_helper.find_document({"process_id": self.process_id})
        if existing_process:
            # Update the existing document
            mongo_helper.update_document(
                {"process_id": self.process_id},
                {
                    "status": self.status,
                    "processed_file_name": self.processed_file_name,
                    "processed_file_mime_type": self.processed_file_mime_type,
                    "last_modified_time": self.last_modified_time,
                    "imported_time": self.imported_time,
                    "last_modified_by": self.last_modified_by,
                },
            )
        else:
            # Insert a new document
            mongo_helper.insert_document(self.model_dump())

    def update_status_to_cosmos(
        self, connection_string: str, database_name: str, collection_name: str
    ):
        """
        Update the status of the process in Cosmos DB.
        """
        # Check if the process_id is already in the database
        mongo_helper = CosmosMongDBHelper(
            connection_string=connection_string,
            db_name=database_name,
            container_name=collection_name,
            indexes=["process_id"],
        )

        # Check if the process_id already exists in the database
        existing_process = mongo_helper.find_document({"process_id": self.process_id})
        if existing_process:
            # Update the existing document
            mongo_helper.update_document(
                {"process_id": self.process_id}, self.model_dump()
            )
        else:
            # Insert a new document
            mongo_helper.insert_document(self.model_dump())

    class Config:
        arbitrary_types_allowed = True
