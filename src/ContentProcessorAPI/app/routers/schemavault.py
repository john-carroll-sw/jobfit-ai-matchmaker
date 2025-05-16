# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import io
import urllib.parse
import uuid

from fastapi import APIRouter, Body, Depends, File, HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse

from app.routers.logics.schemavault import Schemas, get_schemas
from app.routers.models.schmavault.model import (
    Schema,
    SchemaVaultRegisterRequest,
    SchemaVaultUnregisterRequest,
    SchemaVaultUnregisterResponse,
    SchemaVaultUpdateRequest,
)

router = APIRouter(
    prefix="/schemavault",
    tags=["schemavault"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=list[Schema])
async def Get_All_Registered_Schema(
    schemas: Schemas = Depends(get_schemas),
) -> list[Schema]:
    return schemas.GetAll()


@router.post("/", response_model=Schema)
async def Register_Schema(
    data: SchemaVaultRegisterRequest = Body(...),
    file: UploadFile = File(...),
    schemas: Schemas = Depends(get_schemas),
) -> Schema:
    return schemas.Add(
        file,
        Schema(
            Id=str(uuid.uuid4()),
            ClassName=data.ClassName,
            Description=data.Description,
            FileName=file.filename,
            ContentType=file.content_type,
        ),
    )


@router.put("/", response_model=Schema)
async def Update_Schema(
    data: SchemaVaultUpdateRequest = Body(...),
    file: UploadFile = File(...),
    schemas: Schemas = Depends(get_schemas),
) -> Schema:
    return schemas.Update(file, data.SchemaId, data.ClassName)


@router.delete("/")
async def Unregister_Schema(
    data: SchemaVaultUnregisterRequest,
    schemas: Schemas = Depends(get_schemas),
) -> SchemaVaultUnregisterResponse:
    try:
        deleted_schema = schemas.Delete(data.SchemaId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return SchemaVaultUnregisterResponse(
        **{
            "Status": "Success",
            "SchemaId": deleted_schema.Id,
            "ClassName": deleted_schema.ClassName,
            "FileName": deleted_schema.FileName,
        }
    )


@router.get("/schemas/{schema_id}")
async def Get_Registered_Schema_File_By_Schema_Id(
    schema_id: str,
    response: Response,
    schemas: Schemas = Depends(get_schemas),
):
    try:
        schemas = schemas.GetFile(schema_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Encode the filename to support RFC 5987
    encoded_filename = urllib.parse.quote(schemas["FileName"])

    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
        "Content-Type": schemas["ContentType"],
    }

    file_stream = io.BytesIO(schemas["File"])

    return StreamingResponse(
        content=file_stream, media_type=schemas["ContentType"], headers=headers
    )
