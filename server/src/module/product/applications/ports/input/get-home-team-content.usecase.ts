import { HomeTeamContentResult } from '../../dto/result/home-team-content.result';

export interface IGetHomeTeamContentUseCase {
  execute(): Promise<HomeTeamContentResult>;
}
