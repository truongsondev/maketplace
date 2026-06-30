import type { AiPredictionCreateResult, AiPredictionStatusResult } from './virtual-try-on.types';

export class AiServiceVirtualTryOnProvider {
  private readonly baseUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(
    /\/+$/,
    '',
  );

  async createPrediction(input: {
    garmImg: string;
    humanImg: string;
    garmentDes: string;
    category: string;
    crop: boolean;
    forceDc: boolean;
    steps: number;
    seed?: number;
  }): Promise<AiPredictionCreateResult> {
    const response = await fetch(`${this.baseUrl}/virtual-try-on/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        garm_img: input.garmImg,
        human_img: input.humanImg,
        garment_des: input.garmentDes,
        category: input.category,
        crop: input.crop,
        force_dc: input.forceDc,
        mask_only: false,
        steps: input.steps,
        seed: input.seed,
      }),
      signal: AbortSignal.timeout(Number(process.env.VIRTUAL_TRY_ON_TIMEOUT_MS || 120000)),
    });

    if (!response.ok) {
      throw new Error(`AI service failed with status ${response.status}`);
    }

    const payload = (await response.json()) as any;
    return {
      predictionId: String(payload.prediction_id),
      status: String(payload.status),
      output: typeof payload.output === 'string' ? payload.output : null,
      error: typeof payload.error === 'string' ? payload.error : null,
    };
  }

  async getPrediction(predictionId: string): Promise<AiPredictionStatusResult> {
    const response = await fetch(
      `${this.baseUrl}/virtual-try-on/predictions/${encodeURIComponent(predictionId)}`,
      {
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!response.ok) {
      throw new Error(`AI service status failed with status ${response.status}`);
    }

    const payload = (await response.json()) as any;
    return {
      predictionId: String(payload.prediction_id ?? predictionId),
      status: String(payload.status),
      output: typeof payload.output === 'string' ? payload.output : null,
      error: typeof payload.error === 'string' ? payload.error : null,
    };
  }
}
