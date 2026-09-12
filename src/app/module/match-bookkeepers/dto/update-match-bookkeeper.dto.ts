import { PartialType } from '@nestjs/swagger';
import { CreateMatchBookkeeperDto } from './create-match-bookkeeper.dto';

export class UpdateMatchBookkeeperDto extends PartialType(
  CreateMatchBookkeeperDto,
) {}
