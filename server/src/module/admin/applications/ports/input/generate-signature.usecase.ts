import { GenerateSignatureCommand, GenerateSignatureResult } from '../../dto';

export interface IGenerateSignatureUseCase {
  execute(command: GenerateSignatureCommand): GenerateSignatureResult;
}
