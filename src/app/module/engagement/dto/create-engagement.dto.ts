import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class CreateEngagementDto {
  @ApiProperty() @IsMongoId() meetingId!: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  projectTitle!: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  projectDetails!: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  contractText!: string;
  @ApiProperty({
    example: 2500,
    description: 'USD; platform fee is calculated by the backend',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(5)
  @Max(9999999)
  projectValue!: number;
  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  businessAgreed!: boolean;
  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  bookkeeperAgreed!: boolean;
}
export class SignEngagementDto {
  @ApiProperty({ description: 'Typed full name accepting the stored contract' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  signature!: string;
  @ApiProperty({ example: true }) @IsBoolean() @Equals(true) accepted!: boolean;
}
export class SendMessageDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(5000) text!: string;
}
