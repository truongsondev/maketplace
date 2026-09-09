import type { CreateReviewCommand, CreateReviewResult } from '../../dto';

export interface ICreateReviewUseCase {
  execute(command: CreateReviewCommand): Promise<CreateReviewResult>;
}
