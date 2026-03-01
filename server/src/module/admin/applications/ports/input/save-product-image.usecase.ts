import { SaveProductImageCommand, SaveProductImageResult } from '../../dto';

export interface ISaveProductImageUseCase {
  execute(command: SaveProductImageCommand): Promise<SaveProductImageResult>;
}
