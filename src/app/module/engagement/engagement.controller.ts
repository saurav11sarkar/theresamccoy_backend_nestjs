import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import {
  CreateEngagementDto,
  SendMessageDto,
  SignEngagementDto,
} from './dto/create-engagement.dto';
import { EngagementService } from './engagement.service';
@ApiTags('engagement')
@ApiBearerAuth('access-token')
@Controller('engagement')
export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  @Post()
  @UseGuards(AuthGuard('admin'))
  create(@Body() dto: CreateEngagementDto, @Req() req: Request) {
    return this.service.create(dto, req.user!);
  }
  @Get()
  @UseGuards(AuthGuard('admin', 'business', 'bookkeeper'))
  list(@Req() req: Request) {
    return this.service.findAll(req.user!);
  }
  @Get(':id')
  @UseGuards(AuthGuard('admin', 'business', 'bookkeeper'))
  get(@Param('id') id: string, @Req() req: Request) {
    return this.service.findOne(id, req.user!);
  }
  @Post(':id/sign')
  @UseGuards(AuthGuard('bookkeeper', 'business'))
  sign(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: SignEngagementDto,
  ) {
    return this.service.sign(id, req.user!, dto);
  }
  @Post(':id/payment')
  @UseGuards(AuthGuard('business'))
  pay(@Param('id') id: string, @Req() req: Request) {
    return this.service.initiatePayment(id, req.user!);
  }
  @Get(':id/contacts')
  @UseGuards(AuthGuard('bookkeeper', 'business'))
  @SetMetadata('unlockedContacts', true)
  contacts(@Param('id') id: string, @Req() req: Request) {
    return this.service.contacts(id, req.user!);
  }
  @Post(':id/messages')
  @UseGuards(AuthGuard('bookkeeper', 'business'))
  send(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(id, req.user!, dto.text);
  }
  @Get(':id/messages')
  @UseGuards(AuthGuard('bookkeeper', 'business'))
  messages(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('before') before?: string,
  ) {
    return this.service.listMessages(id, req.user!, before);
  }
}
