import type { AdminBannerInput } from '../../applications/dto/admin-banner.dto';
import type {
  ICreateAdminBannerUseCase,
  IGenerateBannerUploadSignatureUseCase,
  IGetAdminBannerByIdUseCase,
  IListAdminBannersUseCase,
  ISetAdminBannerStatusUseCase,
  IUpdateAdminBannerUseCase,
} from '../../applications/ports/input/admin-banner.usecase';

export class AdminBannerController {
  constructor(
    private readonly listUseCase: IListAdminBannersUseCase,
    private readonly getByIdUseCase: IGetAdminBannerByIdUseCase,
    private readonly createUseCase: ICreateAdminBannerUseCase,
    private readonly updateUseCase: IUpdateAdminBannerUseCase,
    private readonly setStatusUseCase: ISetAdminBannerStatusUseCase,
    private readonly generateUploadSignatureUseCase: IGenerateBannerUploadSignatureUseCase,
  ) {}

  listAdminBanners(params: { page: number; limit: number; search?: string; isActive?: boolean }) {
    return this.listUseCase.execute(params);
  }

  getBannerById(id: string) {
    return this.getByIdUseCase.execute(id);
  }

  createBanner(input: AdminBannerInput) {
    return this.createUseCase.execute(input);
  }

  updateBanner(id: string, input: AdminBannerInput) {
    return this.updateUseCase.execute(id, input);
  }

  setBannerStatus(id: string, isActive: boolean) {
    return this.setStatusUseCase.execute(id, isActive);
  }

  generateUploadSignature(folder?: string) {
    return this.generateUploadSignatureUseCase.execute(folder);
  }
}
