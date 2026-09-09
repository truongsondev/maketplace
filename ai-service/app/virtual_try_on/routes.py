from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from .replicate_provider import ReplicateConfigurationError, ReplicateIdmVtonProvider
from .schemas import VirtualTryOnPredictionRequest, VirtualTryOnPredictionResponse

router = APIRouter(prefix="/virtual-try-on", tags=["virtual-try-on"])
provider = ReplicateIdmVtonProvider()


@router.post("/predictions", response_model=VirtualTryOnPredictionResponse)
async def create_prediction(
    request: VirtualTryOnPredictionRequest,
) -> VirtualTryOnPredictionResponse:
    try:
        return await provider.create_prediction(request)
    except ReplicateConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Replicate request timed out") from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Replicate returned status {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Replicate request failed") from exc


@router.get("/predictions/{prediction_id}", response_model=VirtualTryOnPredictionResponse)
async def get_prediction(prediction_id: str) -> VirtualTryOnPredictionResponse:
    try:
        return await provider.get_prediction(prediction_id)
    except ReplicateConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Replicate request timed out") from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Replicate returned status {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Replicate request failed") from exc
