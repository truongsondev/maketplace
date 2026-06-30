import { BadRequestError } from '../../error-handlling/badRequestError';
import { NotFoundError } from '../../error-handlling/notFoundError';
import { AiServiceVirtualTryOnProvider } from './ai-service-virtual-try-on.provider';
import { CloudinaryVirtualTryOnStorage } from './cloudinary-virtual-try-on.storage';
import { PrismaVirtualTryOnRepository } from './prisma-virtual-try-on.repository';
import {
  normalizeProviderStatus,
  type CreateVirtualTryOnInput,
  type VirtualTryOnStatus,
} from './virtual-try-on.types';

const TERMINAL_STATUSES = new Set<VirtualTryOnStatus>([
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'TIMEOUT',
]);

function primaryProductImage(product: any): string | null {
  return product?.images?.[0]?.url ?? null;
}

function attributeText(product: any): string[] {
  return (product?.attributeValues ?? [])
    .map((item: any) => {
      if (item.textValue) return item.textValue;
      if (item.numberValue) return `${item.attribute?.name ?? ''} ${item.numberValue}`;
      if (item.option?.label) return item.option.label;
      const labels = (item.multiSelectOptions ?? []).map((join: any) => join.option?.label).filter(Boolean);
      return labels.join(', ');
    })
    .filter(Boolean);
}

function buildGarmentDescription(product: any): string {
  const categoryNames = (product.categories ?? []).map((entry: any) => entry.category?.name).filter(Boolean);
  return [
    product.name,
    product.productType?.name,
    ...categoryNames,
    ...attributeText(product).slice(0, 6),
  ]
    .filter(Boolean)
    .join(', ')
    .slice(0, 500);
}

function elapsedMs(startedAt: Date | null): number | null {
  return startedAt ? Date.now() - startedAt.getTime() : null;
}

export class VirtualTryOnService {
  constructor(
    private readonly repository: PrismaVirtualTryOnRepository,
    private readonly provider: AiServiceVirtualTryOnProvider,
    private readonly storage: CloudinaryVirtualTryOnStorage,
  ) {}

  generateUploadSignature(userId: string) {
    return this.storage.generateUploadSignature(userId);
  }

  async create(input: CreateVirtualTryOnInput) {
    const rateLimit = Number(process.env.VIRTUAL_TRY_ON_RATE_LIMIT_PER_HOUR || 10);
    const recentCount = await this.repository.countRecentByUser(
      input.userId,
      new Date(Date.now() - 60 * 60 * 1000),
    );
    if (recentCount >= rateLimit) {
      throw new BadRequestError(
        'Bạn đã dùng hết lượt thử đồ AI trong giờ này. Vui lòng thử lại sau.',
        'TRY_ON_RATE_LIMITED',
      );
    }

    const product = await this.repository.findProduct(input.productId);
    if (!product) {
      throw new NotFoundError('Không tìm thấy sản phẩm.');
    }

    const productImageUrl = input.productImageUrl || primaryProductImage(product);
    if (!productImageUrl) {
      throw new BadRequestError('Sản phẩm chưa có ảnh để thử đồ.', 'PRODUCT_IMAGE_MISSING');
    }

    const garmentDes = buildGarmentDescription(product);
    const forceDc = input.category === 'dresses';
    let prediction;
    try {
      prediction = await this.provider.createPrediction({
        garmImg: productImageUrl,
        humanImg: input.humanImageUrl,
        garmentDes,
        category: input.category,
        crop: Boolean(input.crop),
        forceDc,
        steps: input.steps ?? 30,
        seed: input.seed,
      });
    } catch (error) {
      throw new BadRequestError('AI service hiện chưa sẵn sàng. Vui lòng thử lại sau.', 'AI_SERVICE_UNAVAILABLE');
    }

    const created = await this.repository.create({
      input,
      productImageUrl,
      garmentDes,
      forceDc,
      providerJobId: prediction.predictionId,
      providerStatus: normalizeProviderStatus(prediction.status),
      estimatedCostUsd: Number(process.env.VIRTUAL_TRY_ON_COST_PER_RUN_USD || 0.025),
    });

    if (prediction.output && normalizeProviderStatus(prediction.status) === 'SUCCEEDED') {
      return this.persistSuccessfulOutput(created, prediction.output);
    }

    return created;
  }

  async refresh(request: any) {
    if (!request.providerJobId || TERMINAL_STATUSES.has(request.status)) {
      return request;
    }

    let prediction;
    try {
      prediction = await this.provider.getPrediction(request.providerJobId);
    } catch {
      return this.repository.updateStatus(request.id, {
        status: 'FAILED',
        errorCode: 'AI_SERVICE_UNAVAILABLE',
        errorMessage: 'Không lấy được trạng thái từ AI service.',
        latencyMs: elapsedMs(request.startedAt),
        completedAt: new Date(),
      });
    }

    const status = normalizeProviderStatus(prediction.status);
    if (status === 'SUCCEEDED' && prediction.output) {
      return this.persistSuccessfulOutput(request, prediction.output);
    }

    if (['FAILED', 'CANCELED', 'TIMEOUT'].includes(status)) {
      return this.repository.updateStatus(request.id, {
        status,
        errorCode: status === 'FAILED' ? 'AI_PROVIDER_FAILED' : `AI_PROVIDER_${status}`,
        errorMessage: prediction.error || 'AI provider không tạo được ảnh thử đồ.',
        latencyMs: elapsedMs(request.startedAt),
        completedAt: new Date(),
      });
    }

    return this.repository.updateStatus(request.id, { status: 'PROCESSING' });
  }

  async getOwned(id: string, userId: string) {
    const request = await this.repository.findOwned(id, userId);
    if (!request) throw new NotFoundError('Không tìm thấy request thử đồ.');
    return this.refresh(request);
  }

  listMine(userId: string, page: number, limit: number) {
    return this.repository.listMine(userId, page, limit);
  }

  deleteMine(id: string, userId: string) {
    return this.repository.softDelete(id, userId);
  }

  listAdmin(status: VirtualTryOnStatus | undefined, page: number, limit: number) {
    return this.repository.listAdmin({ status, page, limit });
  }

  analytics() {
    return this.repository.analytics();
  }

  private async persistSuccessfulOutput(request: any, outputUrl: string) {
    try {
      const uploaded = await this.storage.uploadResultFromUrl(outputUrl, request.userId, request.id);
      return this.repository.updateStatus(request.id, {
        status: 'SUCCEEDED',
        outputImageUrl: uploaded.secureUrl,
        outputPublicId: uploaded.publicId,
        latencyMs: elapsedMs(request.startedAt),
        completedAt: new Date(),
      });
    } catch {
      return this.repository.updateStatus(request.id, {
        status: 'FAILED',
        errorCode: 'OUTPUT_UPLOAD_FAILED',
        errorMessage: 'Không lưu được ảnh kết quả về Cloudinary.',
        latencyMs: elapsedMs(request.startedAt),
        completedAt: new Date(),
      });
    }
  }
}
