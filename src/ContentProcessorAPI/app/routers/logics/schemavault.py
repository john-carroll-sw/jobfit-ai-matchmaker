# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from fastapi import UploadFile
from pydantic import BaseModel, Field

from app.appsettings import AppConfiguration, get_app_config
from app.libs.cosmos_db.helper import CosmosMongDBHelper
from app.libs.storage_blob.helper import StorageBlobHelper
from app.routers.models.schmavault.model import Schema


class Schemas(BaseModel):
    """
    This Class is used to handle all the operations related to Schema Vault
    It will be instantiated and injected in the router

    check the function get_schemas in app/routers/schemavault.py
    it will be injected in the router - schemavalut.py
    """

    config: AppConfiguration = Field(default=None)
    blobHelper: StorageBlobHelper = Field(default=None)
    mongoHelper: CosmosMongDBHelper = Field(default=None)

    def __init__(self):
        super().__init__()
        self.config = get_app_config()
        self.blobHelper = StorageBlobHelper(
            self.config.app_storage_blob_url,
            f"{self.config.app_cps_configuration}/{self.config.app_cosmos_container_schema}",
        )
        self.mongoHelper = CosmosMongDBHelper(
            connection_string=self.config.app_cosmos_connstr,
            db_name=self.config.app_cosmos_database,
            container_name=self.config.app_cosmos_container_schema,
            indexes=[("ClassName", 1), ("Id", 1)],
        )

    def GetAll(self) -> list[Schema]:
        # Get all the Schema definition python file
        schemas = self.mongoHelper.find_document(query={}, sort_fields=["ClassName"])
        return [Schema(**schema) for schema in schemas]

    def GetFile(self, schema_id: str):
        # Return Blob Python File
        # Adding Content-Type in Header and resturn the file
        schema_obj = self.mongoHelper.find_document(query={"Id": schema_id})

        if not schema_obj:
            raise Exception("Schema not found")

        schema_obj = Schema(**schema_obj[0])

        return {
            "File": self.blobHelper.download_blob(schema_obj.FileName, schema_obj.Id),
            "ContentType": schema_obj.ContentType,
            "FileName": schema_obj.FileName,
        }

    def Add(self, file: UploadFile, schema: Schema) -> Schema:
        # Upload the Schema definition python file
        result = self.blobHelper.upload_blob(file.filename, file.file, schema.Id)

        schema.Created_On = result["date"]

        self.mongoHelper.insert_document(schema.model_dump(mode="json"))
        return schema

    def Update(self, file: UploadFile, schema_id: str, class_name: str) -> Schema:
        # Upload the Schema definition python file
        result = self.blobHelper.replace_blob(file.filename, file.file, schema_id)

        # Find Document by Id
        schemas = self.mongoHelper.find_document(query={"Id": schema_id})

        if not schemas:
            raise Exception("Schema not found")

        schema_object = Schema(**schemas[0])

        # Update the Schema
        schema_object.ClassName = class_name
        schema_object.FileName = file.filename
        schema_object.ContentType = file.content_type
        schema_object.Updated_On = result["date"]

        self.mongoHelper.update_document(
            schema_object.Id,
            schema_object.model_dump(mode="json"),
        )
        return schema_object

    def Delete(self, schema_id: str) -> Schema:
        # Find Document by Id
        schemas = self.mongoHelper.find_document(query={"Id": schema_id})

        if not schemas:
            raise Exception("Schema not found")

        schema_object = Schema(**schemas[0])

        # Delete the Document
        self.mongoHelper.delete_document(schema_id)

        # Delete the Blob and container
        self.blobHelper.delete_blob_and_cleanup(
            schema_object.FileName, schema_object.Id
        )

        return schema_object

    class Config:
        arbitrary_types_allowed = True


schemas = Schemas()


def get_schemas() -> Schemas:
    return schemas
