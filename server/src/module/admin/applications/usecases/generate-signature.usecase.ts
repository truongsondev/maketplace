import { GenerateSignatureCommand, GenerateSignatureResult } from '../dto';
import { IGenerateSignatureUseCase } from '../ports/input/generate-signature.usecase';
import { ICloudinaryService } from '../ports/output/cloudinary.service';
import { createLogger } from '@/shared/util/logger';

export class GenerateSignatureUseCase implements IGenerateSignatureUseCase {
  private readonly logger = createLogger('GenerateSignatureUseCase');

  constructor(private readonly cloudinaryService: ICloudinaryService) {}

  execute(command: GenerateSignatureCommand): GenerateSignatureResult {
    this.logger.info('Generating upload signature', { productId: command.productId });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = command.productId ? `products/${command.productId}` : 'products';

    const paramsToSign: Record<string, any> = {
      timestamp,
      folder,
    };

    const signature = this.cloudinaryService.generateSignature(paramsToSign);

    this.logger.info('Upload signature generated successfully', { folder, timestamp });

    return {
      cloudName: this.cloudinaryService.getCloudName(),
      apiKey: this.cloudinaryService.getApiKey(),
      timestamp,
      folder,
      signature,
    };
  }
}
