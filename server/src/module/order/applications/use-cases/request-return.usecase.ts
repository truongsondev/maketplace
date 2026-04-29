import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { IRequestReturnUseCase } from '../ports/input/request-return.usecase';
import type {
  IOrderReturnRepository,
  RequestReturnInput,
  RequestReturnResult,
} from '../ports/output/order-return.repository';

export class RequestReturnUseCase implements IRequestReturnUseCase {
  constructor(private readonly repo: IOrderReturnRepository) {}

  async execute(input: RequestReturnInput): Promise<RequestReturnResult> {
    if (!input.userId) {
      throw new BadRequestError('User ID not found');
    }

    if (!input.orderId) {
      throw new BadRequestError('orderId is required');
    }

    if (!['WRONG_MODEL', 'WRONG_SIZE', 'DEFECTIVE'].includes(input.reasonCode)) {
      throw new BadRequestError('Invalid return reason');
    }

    if (!input.bankAccountName?.trim() || !input.bankAccountNumber?.trim() || !input.bankName?.trim()) {
      throw new BadRequestError('bankAccountName, bankAccountNumber and bankName are required');
    }

    if (!Array.isArray(input.evidenceImages) || input.evidenceImages.length === 0) {
      throw new BadRequestError('At least one evidence image is required');
    }

    const hasInvalidImage = input.evidenceImages.some(
      (image) => !image || typeof image.url !== 'string' || !image.url.trim(),
    );
    if (hasInvalidImage) {
      throw new BadRequestError('Invalid evidence image');
    }

    return this.repo.requestReturn({
      userId: input.userId,
      orderId: input.orderId,
      reasonCode: input.reasonCode,
      reason: input.reason ?? null,
      evidenceImages: input.evidenceImages,
      bankAccountName: input.bankAccountName.trim(),
      bankAccountNumber: input.bankAccountNumber.trim(),
      bankName: input.bankName.trim(),
    });
  }
}
