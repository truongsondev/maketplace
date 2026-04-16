import type {
  CreateReviewCommand,
  CreateReviewResult,
  GenerateReviewUploadSignatureCommand,
  GenerateReviewUploadSignatureResult,
  GetOrderReviewStatusQuery,
  GetOrderReviewStatusResult,
} from '../../applications/dto';
import type { ICreateReviewUseCase } from '../../applications/ports/input/create-review.usecase';
import type { IGenerateReviewUploadSignatureUseCase } from '../../applications/ports/input/generate-review-signature.usecase';
import type { IGetOrderReviewStatusUseCase } from '../../applications/ports/input/get-order-review-status.usecase';

export class ReviewController {
  constructor(
    private readonly generateSignatureUseCase: IGenerateReviewUploadSignatureUseCase,
    private readonly createReviewUseCase: ICreateReviewUseCase,
    private readonly getOrderReviewStatusUseCase: IGetOrderReviewStatusUseCase,
  ) {}

  generateUploadSignature(
    command: GenerateReviewUploadSignatureCommand,
  ): GenerateReviewUploadSignatureResult {
    return this.generateSignatureUseCase.execute(command);
  }

  createReview(command: CreateReviewCommand): Promise<CreateReviewResult> {
    return this.createReviewUseCase.execute(command);
  }

  getOrderReviewStatus(query: GetOrderReviewStatusQuery): Promise<GetOrderReviewStatusResult> {
    return this.getOrderReviewStatusUseCase.execute(query);
  }
}
