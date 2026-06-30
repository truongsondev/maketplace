from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, HttpUrl, field_validator


class VirtualTryOnPredictionRequest(BaseModel):
    garm_img: HttpUrl
    human_img: HttpUrl
    garment_des: str = Field(min_length=1, max_length=500)
    category: str
    crop: bool = False
    force_dc: bool = False
    mask_only: bool = False
    steps: int = Field(default=30, ge=1, le=40)
    seed: int | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in {"upper_body", "lower_body", "dresses"}:
            raise ValueError("category must be upper_body, lower_body or dresses")
        return value


class VirtualTryOnPredictionResponse(BaseModel):
    prediction_id: str
    status: str
    output: str | None = None
    error: str | None = None
    urls: dict[str, Any] | None = None
