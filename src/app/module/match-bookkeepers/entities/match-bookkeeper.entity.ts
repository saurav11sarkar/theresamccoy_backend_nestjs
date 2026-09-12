import { Bookkeeper } from '../../bookkeeper/entities/bookkeeper.entity';

export class MatchBookkeeper {
  bookkeeper!: Bookkeeper;
  matchScore!: number;
  matchedOn!: string[];
}
