import cloudinary from '../../infrastructure/cloudinary/cloudinary.config';

export class CloudinaryVirtualTryOnStorage {
  generateUploadSignature(userId: string): {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    signature: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `virtual-try-on/users/${userId}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      timestamp,
      folder,
      signature,
    };
  }

  async uploadResultFromUrl(
    imageUrl: string,
    userId: string,
    requestId: string,
  ): Promise<{ secureUrl: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: `virtual-try-on/results/${userId}`,
      public_id: requestId,
      overwrite: true,
      resource_type: 'image',
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
    };
  }
}
