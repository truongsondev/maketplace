import type { AdminBannerInput, AdminBannerSummary } from '../../dto/admin-banner.dto';

export interface IListAdminBannersUseCase {
  execute(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminBannerSummary[]; total: number }>;
}

export interface IGetAdminBannerByIdUseCase {
  execute(id: string): Promise<AdminBannerSummary>;
}

export interface ICreateAdminBannerUseCase {
  execute(input: AdminBannerInput): Promise<AdminBannerSummary>;
}

export interface IUpdateAdminBannerUseCase {
  execute(id: string, input: AdminBannerInput): Promise<AdminBannerSummary>;
}

export interface ISetAdminBannerStatusUseCase {
  execute(id: string, isActive: boolean): Promise<AdminBannerSummary>;
}

export interface IGenerateBannerUploadSignatureUseCase {
  execute(folder?: string): {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  };
}
