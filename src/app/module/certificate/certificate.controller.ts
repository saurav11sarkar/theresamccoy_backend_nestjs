import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from 'src/app/helpers/fileUploder';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CertificateService } from './certificate.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

@ApiTags('certificate')
@Controller('certificate')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a certificate' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('certificateUrl', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createCertificate(
    @Body() createCertificateDto: CreateCertificateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.certificateService.createCertificate(
      createCertificateDto,
      file,
    );
    return { message: 'Certificate created successfully', data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Get all certificates' })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'bookkeeper'))
  @HttpCode(HttpStatus.OK)
  async getAllCertificates(@Req() req: Request) {
    const filter = pick(req.query, ['title', 'searchTerm']);
    const param = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.certificateService.getAllCertificates(
      filter,
      param,
      req.user!,
    );
    return {
      message: 'All certificates',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a certificate by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'bookkeeper'))
  @HttpCode(HttpStatus.OK)
  async getCertificateById(@Req() req: Request, @Param('id') id: string) {
    const result = await this.certificateService.getCertificateById(
      id,
      req.user!,
    );
    return {
      message: 'Certificate found',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a certificate by id' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('certificateUrl', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async updateCertificateById(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.certificateService.updateCertificate(
      id,
      updateCertificateDto,
      file,
    );
    return {
      message: 'Certificate updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a certificate by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteCertificateById(@Param('id') id: string) {
    const result = await this.certificateService.deleteCertificate(id);
    return {
      message: 'Certificate deleted successfully',
      data: result,
    };
  }
}
