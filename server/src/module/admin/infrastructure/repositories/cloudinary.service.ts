import cloudinary from '../../../../infrastructure/cloudinary/cloudinary.config';
import { ICloudinaryService } from '../../applications/ports/output/cloudinary.service';

export class CloudinaryServiceImpl implements ICloudinaryService {
  generateSignature(params: Record<string, any>): string {
    return cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    return cloudinary.uploader.destroy(publicId);
  }

  getCloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME!;
  }

  getApiKey(): string {
    return process.env.CLOUDINARY_API_KEY!;
  }
}
