import datetime
from typing import Optional

from pydantic import BaseModel, Field

from libs.azure_helper.comsos_mongo import CosmosMongDBHelper


class Schema(BaseModel):
    Id: str
    ClassName: str
    Description: str
    FileName: str
    ContentType: str
    Created_On: Optional[datetime.datetime] = Field(default=None)
    Updated_On: Optional[datetime.datetime] = Field(default=None)

    @staticmethod
    def get_schema(
        connection_string: str,
        database_name: str,
        collection_name: str,
        schema_id: str,
    ) -> Optional["Schema"]:
        """
        Get the schema for the given schema_id
        """

        if schema_id is None or schema_id == "":
            raise Exception("Schema Id is not provided.")

        mongo_helper = CosmosMongDBHelper(
            connection_string=connection_string,
            db_name=database_name,
            container_name=collection_name,
            indexes=["Id", "ClassName"],
        )

        # Check if the schema exists
        schema_information = mongo_helper.find_document({"Id": schema_id})
        if not schema_information or len(schema_information) == 0:
            raise Exception(
                f"Schema with Id {schema_id} not found in {collection_name}."
            )

        return Schema(**(schema_information[0]))
