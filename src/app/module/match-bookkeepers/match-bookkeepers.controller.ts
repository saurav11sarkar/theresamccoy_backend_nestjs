import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
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
import AuthGuard from 'src/app/middlewares/auth.guard';
import { MatchBookkeepersService } from './match-bookkeepers.service';

@ApiTags('Match Bookkeepers')
@Controller('match-bookkeepers')
export class MatchBookkeepersController {
  constructor(
    private readonly matchBookkeepersService: MatchBookkeepersService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get ranked bookkeeper matches for the business owner',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business'))
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @HttpCode(HttpStatus.OK)
  async getMatches(
    @Req() req: Request,
    @Query('searchTerm') searchTerm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.matchBookkeepersService.getMatches(req.user!.id, {
      searchTerm,
      page,
      limit,
    });

    return {
      message: 'Matched bookkeepers retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }
}
