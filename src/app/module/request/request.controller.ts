import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { RequestService } from './request.service';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get('/')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Get all requests' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({
    name: 'searchTerm',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    type: 'string',
    required: false,
  })
  @HttpCode(HttpStatus.OK)
  async getAllRequest(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'status']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.requestService.getAllRequest(filters, options);
    return {
      message: 'Requests fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('/:bookkeeperId')
  @ApiOperation({ summary: 'Request for a bookkeeper' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business'))
  @HttpCode(HttpStatus.CREATED)
  async createRequest(
    @Req() req: Request,
    @Param('bookkeeperId') bookkeeperId: string,
  ) {
    const result = await this.requestService.createRequest(
      req.user!.id,
      bookkeeperId,
    );

    return {
      message: 'Request created successfully',
      data: result,
    };
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get all requests for logged in user' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'business'))
  @ApiQuery({
    name: 'searchTerm',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    type: 'string',
    required: false,
  })
  @HttpCode(HttpStatus.OK)
  async getMyRequests(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'status']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.requestService.getMyRequests(
      req.user!.id,
      filters,
      options,
    );
    return {
      message: 'My requests fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Patch('accept/:requestId')
  @ApiOperation({ summary: 'Accept a request' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @HttpCode(HttpStatus.OK)
  async acceptRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
  ) {
    const result = await this.requestService.acceptRequest(
      requestId,
      req.user!.id,
    );
    return {
      message: 'Request accepted successfully',
      data: result,
    };
  }

  @Patch('reject/:requestId')
  @ApiOperation({ summary: 'Reject a request' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @HttpCode(HttpStatus.OK)
  async rejectRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
  ) {
    const result = await this.requestService.rejectRequest(
      requestId,
      req.user!.id,
    );
    return {
      message: 'Request rejected successfully',
      data: result,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Get a request by id' })
  @HttpCode(HttpStatus.OK)
  async getRequest(@Param('id') id: string) {
    const result = await this.requestService.getRequest(id);
    return {
      message: 'Request fetched successfully',
      data: result,
    };
  }
}
