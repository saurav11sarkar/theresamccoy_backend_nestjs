import { PartialType } from '@nestjs/swagger';
import { CreateBusinesswonerDto } from './create-businesswoner.dto';

export class UpdateBusinesswonerDto extends PartialType(
  CreateBusinesswonerDto,
) {}
