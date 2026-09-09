from __future__ import annotations

import os
from typing import Any

import httpx

from .schemas import VirtualTryOnPredictionRequest, VirtualTryOnPredictionResponse


class ReplicateConfigurationError(RuntimeError):
    pass


class ReplicateIdmVtonProvider:
    def __init__(self) -> None:
        self.token = os.getenv("REPLICATE_API_TOKEN", "").strip()
        self.model = os.getenv("REPLICATE_IDM_VTON_MODEL", "cuuupid/idm-vton").strip()
        self.version = os.getenv("REPLICATE_IDM_VTON_VERSION", "").strip()
        self.base_url = "https://api.replicate.com/v1"
        self.timeout = float(os.getenv("REPLICATE_HTTP_TIMEOUT_SECONDS", "60"))
        self._resolved_version: str | None = None

    def _headers(self) -> dict[str, str]:
        if not self.token:
            raise ReplicateConfigurationError("REPLICATE_API_TOKEN is not configured")
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def _version_id(self, client: httpx.AsyncClient) -> str:
        if self.version:
            return self.version
        if self._resolved_version:
            return self._resolved_version

        response = await client.get(
            f"{self.base_url}/models/{self.model}",
            headers=self._headers(),
        )
        response.raise_for_status()
        payload = response.json()
        version = payload.get("latest_version", {}).get("id")
        if not version:
            raise ReplicateConfigurationError(
                f"Cannot resolve latest version for Replicate model {self.model}"
            )

        self._resolved_version = str(version)
        return self._resolved_version

    @staticmethod
    def _extract_output(raw_output: Any) -> str | None:
        if isinstance(raw_output, str):
            return raw_output
        if isinstance(raw_output, list) and raw_output:
            first = raw_output[0]
            return first if isinstance(first, str) else None
        return None

    @staticmethod
    def _to_response(payload: dict[str, Any]) -> VirtualTryOnPredictionResponse:
        return VirtualTryOnPredictionResponse(
            prediction_id=str(payload.get("id", "")),
            status=str(payload.get("status", "unknown")),
            output=ReplicateIdmVtonProvider._extract_output(payload.get("output")),
            error=str(payload["error"]) if payload.get("error") else None,
            urls=payload.get("urls") if isinstance(payload.get("urls"), dict) else None,
        )

    async def create_prediction(
        self, request: VirtualTryOnPredictionRequest
    ) -> VirtualTryOnPredictionResponse:
        input_payload = {
            "garm_img": str(request.garm_img),
            "human_img": str(request.human_img),
            "garment_des": request.garment_des,
            "category": request.category,
            "crop": request.crop,
            "force_dc": request.force_dc,
            "mask_only": request.mask_only,
            "steps": request.steps,
        }
        if request.seed is not None:
            input_payload["seed"] = request.seed

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            payload = {
                "version": await self._version_id(client),
                "input": input_payload,
            }
            response = await client.post(
                f"{self.base_url}/predictions",
                headers=self._headers(),
                json=payload,
            )
            response.raise_for_status()
            return self._to_response(response.json())

    async def get_prediction(self, prediction_id: str) -> VirtualTryOnPredictionResponse:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/predictions/{prediction_id}",
                headers=self._headers(),
            )
            response.raise_for_status()
            return self._to_response(response.json())
