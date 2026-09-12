import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const emptyStringToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class CreateUserDto {
  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsString()
  firstName!: string;

  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: ['bookkeeper', 'business', 'admin'] })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsEnum(['bookkeeper', 'business', 'admin'])
  role?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  otpExpiry?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim() === '') return undefined;
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  verifiedForget?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'suspended'] })
  @Transform(emptyStringToUndefined)
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}
