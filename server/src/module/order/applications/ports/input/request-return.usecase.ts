import type { RequestReturnInput, RequestReturnResult } from '../output/order-return.repository';

export interface IRequestReturnUseCase {
  execute(input: RequestReturnInput): Promise<RequestReturnResult>;
}
