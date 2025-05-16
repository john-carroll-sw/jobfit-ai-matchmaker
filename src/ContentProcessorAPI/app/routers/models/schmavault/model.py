# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import datetime
import json
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class Schema(BaseModel):
    Id: str
    ClassName: str
    Description: str
    FileName: str
    ContentType: str
    Created_On: Optional[datetime.datetime] = Field(default=None)
    Updated_On: Optional[datetime.datetime] = Field(default=None)

    @model_validator(mode="before")
    @classmethod
    def parse_dates(cls, values):
        if "Created_On" in values and isinstance(values["Created_On"], str):
            values["Created_On"] = datetime.datetime.fromisoformat(
                values["Created_On"].replace("Z", "+00:00")
            ).astimezone(datetime.timezone.utc)
        if "Updated_On" in values and isinstance(values["Updated_On"], str):
            values["Updated_On"] = datetime.datetime.fromisoformat(
                values["Updated_On"].replace("Z", "+00:00")
            ).astimezone(datetime.timezone.utc)
        return values


class SchemaVaultUnregisterResponse(BaseModel):
    Status: str
    SchemaId: str
    ClassName: str
    FileName: str

    def to_dict(self):
        return self.model_dump()


class SchemaVaultRegisterRequest(BaseModel):
    ClassName: str
    Description: str

    @model_validator(mode="before")
    @classmethod
    def validate_to_json(cls, value):
        if isinstance(value, str):
            return cls(**json.loads(value))
        return value


class SchemaVaultUpdateRequest(BaseModel):
    SchemaId: str
    ClassName: str

    @model_validator(mode="before")
    @classmethod
    def validate_to_json(cls, value):
        if isinstance(value, str):
            return cls(**json.loads(value))
        return value


class SchemaVaultUnregisterRequest(BaseModel):
    SchemaId: str

    @model_validator(mode="before")
    @classmethod
    def validate_to_json(cls, value):
        if isinstance(value, str):
            return cls(**json.loads(value))
        return value
