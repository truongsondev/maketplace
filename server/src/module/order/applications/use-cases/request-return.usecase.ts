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

    if (!['EXCHANGE', 'RETURN_REFUND'].includes(input.requestType)) {
      throw new BadRequestError('Invalid return request type');
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestError('At least one order item is required');
    }
    if (input.items.some((item) => !item.orderItemId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      throw new BadRequestError('Invalid return item quantity');
    }
    if (
      input.requestType === 'EXCHANGE' &&
      input.items.some((item) => !item.requestedVariantId?.trim())
    ) {
      throw new BadRequestError('requestedVariantId is required for exchanges');
    }

    if (
      input.requestType === 'RETURN_REFUND' &&
      (!input.bankAccountName?.trim() || !input.bankAccountNumber?.trim() || !input.bankName?.trim())
    ) {
      throw new BadRequestError('bankAccountName, bankAccountNumber and bankName are required');
    }

    if (
      input.reasonCode === 'DEFECTIVE' &&
      (!Array.isArray(input.evidenceImages) || input.evidenceImages.length === 0)
    ) {
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
      requestType: input.requestType,
      items: input.items,
      reasonCode: input.reasonCode,
      reason: input.reason ?? null,
      evidenceImages: input.evidenceImages,
      bankAccountName: input.bankAccountName?.trim() || null,
      bankAccountNumber: input.bankAccountNumber?.trim() || null,
      bankName: input.bankName?.trim() || null,
    });
  }
}
