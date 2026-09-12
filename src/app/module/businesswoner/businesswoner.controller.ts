import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { BusinesswonerService } from './businesswoner.service';
import { CreateBusinesswonerDto } from './dto/create-businesswoner.dto';
import { UpdateBusinesswonerDto } from './dto/update-businesswoner.dto';
import { BusinesswonerStatus } from './entities/businesswoner.entity';

@ApiTags('Businesswoner')
@Controller('businesswoner')
export class BusinesswonerController {
  constructor(private readonly businesswonerService: BusinesswonerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a businesswoner' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business'))
  @HttpCode(HttpStatus.CREATED)
  async createBusinesswoner(
    @Req() req: Request,
    @Body() createBusinesswonerDto: CreateBusinesswonerDto,
  ) {
    const result = await this.businesswonerService.createBusinesswoner(
      req.user!.id,
      createBusinesswonerDto,
    );

    return {
      message: 'Businesswoner created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesswoner' })
  @ApiQuery({ name: 'searchTerm', description: 'Search term', required: false })
  @ApiQuery({
    name: 'businessEmail',
    description: 'Business email',
    required: false,
  })
  @ApiQuery({
    name: 'fullName',
    description: 'Full name',
    required: false,
  })
  @ApiQuery({
    name: 'businessName',
    description: 'Business name',
    required: false,
  })
  @ApiQuery({
    name: 'businessPhoneNumber',
    description: 'Business phone number',
    required: false,
  })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Limit', required: false })
  @ApiQuery({ name: 'sortBy', description: 'Sort by', required: false })
  @ApiQuery({ name: 'sortOrder', description: 'Sort order', required: false })
  @ApiQuery({
    name: 'status',
    description: 'Approval status',
    required: false,
    enum: BusinesswonerStatus,
  })
  @HttpCode(HttpStatus.OK)
  async getBusinesswonerList(@Req() req: Request) {
    const filter = pick(req.query, [
      'searchTerm',
      'fullName',
      'businessName',
      'businessEmail',
      'businessPhoneNumber',
      'status',
    ]);
    const params = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.businesswonerService.getAllBusinesswoner(
      filter,
      params,
    );
    return {
      message: 'Businesswoner list retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get businesswoner by id' })
  @HttpCode(HttpStatus.OK)
  async getBusinesswonerById(@Param('id') id: string) {
    const result = await this.businesswonerService.getBusinesswonerById(id);
    return {
      message: 'Businesswoner retrieved successfully',
      data: result,
    };
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a businesswoner application' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async approveBusinesswoner(@Param('id') id: string, @Req() req: Request) {
    const result = await this.businesswonerService.approveBusinesswoner(
      id,
      req.user!.id,
    );

    return {
      message: 'Businesswoner approved successfully',
      data: result,
    };
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a businesswoner application' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async rejectBusinesswoner(@Param('id') id: string, @Req() req: Request) {
    const result = await this.businesswonerService.rejectBusinesswoner(
      id,
      req.user!.id,
    );
    return {
      message: 'Businesswoner rejected successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update businesswoner by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business', 'admin'))
  @HttpCode(HttpStatus.OK)
  async updateBusinesswonerById(
    @Param('id') id: string,
    @Body() updateBusinesswonerDto: UpdateBusinesswonerDto,
  ) {
    const result = await this.businesswonerService.updateBusinesswoner(
      id,
      updateBusinesswonerDto,
    );
    return {
      message: 'Businesswoner updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete businesswoner by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business', 'admin'))
  @HttpCode(HttpStatus.OK)
  async deleteBusinesswonerById(@Param('id') id: string) {
    const result = await this.businesswonerService.deleteBusinesswoner(id);
    return {
      message: 'Businesswoner deleted successfully',
      data: result,
    };
  }
}
