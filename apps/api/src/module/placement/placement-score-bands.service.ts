import { BadRequestException, Injectable } from '@nestjs/common';
import {
  recommendCefrFromScore,
  replacePlacementScoreBandsInputSchema,
  scoreBandsOverlap,
  type PlacementScoreBand,
  type ReplacePlacementScoreBandsInput,
} from '@english-school/shared';
import { PlacementScoreBandsRepository } from './placement-score-bands.repository.js';

@Injectable()
export class PlacementScoreBandsService {
  constructor(private readonly bands: PlacementScoreBandsRepository) {}

  list(): Promise<PlacementScoreBand[]> {
    return this.bands.list();
  }

  async replace(
    raw: ReplacePlacementScoreBandsInput,
  ): Promise<PlacementScoreBand[]> {
    const input = replacePlacementScoreBandsInputSchema.parse(raw);
    if (scoreBandsOverlap(input)) {
      throw new BadRequestException('Score bands must not overlap');
    }
    return this.bands.replaceAll(input);
  }

  async recommendLevel(overall: number) {
    const bands = await this.bands.list();
    return recommendCefrFromScore(overall, bands);
  }
}
