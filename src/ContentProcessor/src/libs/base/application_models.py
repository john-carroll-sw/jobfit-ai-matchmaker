from typing import TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppModelBase(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True, arbitrary_types_allowed=True, validate_assignment=True
    )


T = TypeVar("T", bound="ModelBaseSettings")


class ModelBaseSettings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore", case_sensitive=False)
