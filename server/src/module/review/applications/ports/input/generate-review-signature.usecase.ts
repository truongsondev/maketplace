import type {
  GenerateReviewUploadSignatureCommand,
  GenerateReviewUploadSignatureResult,
} from '../../dto';

export interface IGenerateReviewUploadSignatureUseCase {
  execute(command: GenerateReviewUploadSignatureCommand): GenerateReviewUploadSignatureResult;
}
