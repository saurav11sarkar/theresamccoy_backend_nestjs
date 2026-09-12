import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateBusinesswonerDto {
  // @ApiPropertyOptional({
  //   description: 'User MongoDB ID',
  //   example: '66c42f918e12f96dd274bc11',
  // })
  // @IsMongoId()
  // @IsNotEmpty()
  // userId!: string;

  @ApiPropertyOptional({
    example: 'John Smith',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({
    example: 'Smith Consulting LLC',
  })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiPropertyOptional({
    example: 'john@smithconsulting.com',
  })
  @IsEmail()
  @IsNotEmpty()
  businessEmail!: string;

  @ApiPropertyOptional({
    example: '+1 555 123 4567',
  })
  @IsString()
  @IsNotEmpty()
  businessPhoneNumber!: string;

  @ApiPropertyOptional({
    example: 'English',
  })
  @IsString()
  @IsNotEmpty()
  preferredLanguage!: string;

  @ApiPropertyOptional({
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  industry!: string;

  @ApiPropertyOptional({
    example: 'LLC',
  })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiPropertyOptional({
    example: 5,
  })
  @IsNumber()
  @Min(0)
  yearsInBusiness!: number;

  @ApiPropertyOptional({
    example: 10,
  })
  @IsNumber()
  @Min(0)
  numberOfEmployees!: number;

  @ApiPropertyOptional({
    example: 'New York, USA',
  })
  @IsString()
  @IsNotEmpty()
  businessLocation!: string;

  @ApiPropertyOptional({
    example: 'https://smithconsulting.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'Ongoing support' })
  @IsString()
  @IsNotEmpty()
  supportType!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Ongoing bookkeeping', 'Catch-up / cleanup work'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  engagementTypes!: string[];

  @ApiPropertyOptional({
    example: '$1000000 - $2000000',
  })
  @IsString()
  @IsNotEmpty()
  annualSales!: string;

  @ApiPropertyOptional({
    example: 'Hybrid',
    description: 'Example: Onsite, Virtual, Hybrid',
  })
  @IsString()
  @IsNotEmpty()
  onsiteOrVirtual!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Behind / need clean-up', 'Need a bookkeeper'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  whereDoYouStandToday!: string[];

  @ApiPropertyOptional({
    example: 'QuickBooks and Excel',
  })
  @IsString()
  @IsNotEmpty()
  currentSystem!: string;

  @ApiPropertyOptional({
    example: '500-1000',
  })
  @IsString()
  @IsNotEmpty()
  monthlyTransactionVolume!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Monthly bookkeeping', 'Payroll'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  servicesYouAreLookingFor!: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Tax services', 'Business funding consultation'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestedIn?: string[];

  @ApiPropertyOptional({
    example: 'Yes',
  })
  @IsString()
  @IsNotEmpty()
  businessCoaching!: string;

  @ApiPropertyOptional({
    example: '$1000 - $2000',
  })
  @IsString()
  @IsNotEmpty()
  monthlyBudgetRange!: string;

  @ApiPropertyOptional({
    example: 'I would like to discuss tax planning as well.',
  })
  @IsOptional()
  @IsString()
  anythingElse?: string;
}
