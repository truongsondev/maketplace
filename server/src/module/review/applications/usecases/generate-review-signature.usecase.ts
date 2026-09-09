import { createLogger } from '@/shared/util/logger';
import type {
  GenerateReviewUploadSignatureCommand,
  GenerateReviewUploadSignatureResult,
} from '../dto';
import type { IGenerateReviewUploadSignatureUseCase } from '../ports/input/generate-review-signature.usecase';
import type { ICloudinaryService } from '../ports/output/cloudinary.service';

export class GenerateReviewUploadSignatureUseCase implements IGenerateReviewUploadSignatureUseCase {
  private readonly logger = createLogger('GenerateReviewUploadSignatureUseCase');

  constructor(private readonly cloudinaryService: ICloudinaryService) {}

  execute(command: GenerateReviewUploadSignatureCommand): GenerateReviewUploadSignatureResult {
    const timestamp = Math.floor(Date.now() / 1000);
    const folderBase = `reviews/${command.userId}`;
    const folder = command.orderId ? `${folderBase}/${command.orderId}` : folderBase;

    this.logger.info('Generating review upload signature', {
      userId: command.userId,
      orderId: command.orderId,
      folder,
    });

    const paramsToSign: Record<string, any> = { timestamp, folder };
    const signature = this.cloudinaryService.generateSignature(paramsToSign);

    return {
      cloudName: this.cloudinaryService.getCloudName(),
      apiKey: this.cloudinaryService.getApiKey(),
      timestamp,
      folder,
      signature,
    };
  }
}
