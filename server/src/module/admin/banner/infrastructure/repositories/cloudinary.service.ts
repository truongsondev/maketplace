import cloudinary from '../../../../../infrastructure/cloudinary/cloudinary.config';
import type { ICloudinaryService } from '../../applications/ports/output/cloudinary.service';

export class CloudinaryServiceImpl implements ICloudinaryService {
  generateSignature(params: Record<string, string | number>): string {
    return cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  }

  getCloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME!;
  }

  getApiKey(): string {
    return process.env.CLOUDINARY_API_KEY!;
  }
}
