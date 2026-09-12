import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ChangeMeetingStatusDto {
  @ApiProperty({ enum: ['completed', 'cancelled'], example: 'completed' })
  @IsIn(['completed', 'cancelled'])
  status!: 'completed' | 'cancelled';
}
