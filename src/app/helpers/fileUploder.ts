import {
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { randomUUID } from 'crypto';
import { memoryStorage } from 'multer';
import path from 'path';
import config from '../config';

const allowedExtensions = new Set([
  '.jpeg',
  '.jpg',
  '.png',
  '.gif',
  '.webp',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.csv',
  '.pdf',
]);

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'text/csv',
  'application/csv',
  'application/pdf',
]);

const credentials =
  config.aws.accessKeyId && config.aws.secretAccessKey
    ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      }
    : undefined;

// Without explicit credentials, AWS SDK uses ECS/EKS/EC2 roles, profiles, or env.
const s3Client = new S3Client({ region: config.aws.region, credentials });

const assertAwsConfig = (): void => {
  const missing = [
    !config.aws.region && 'AWS_REGION',
    !config.aws.bucket && 'AWS_BUCKET_NAME',
  ].filter(Boolean);

  if (missing.length) {
    throw new InternalServerErrorException(
      `AWS S3 is not configured. Missing: ${missing.join(', ')}`,
    );
  }
  if (!!config.aws.accessKeyId !== !!config.aws.secretAccessKey) {
    throw new InternalServerErrorException(
      'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set together',
    );
  }
};

const sanitizeFileName = (name: string): string => {
  const extension = path.extname(name).toLowerCase();
  const baseName = path
    .basename(name, extension)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return `${baseName || 'file'}${extension}`;
};

const uploadConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: config.aws.maxFileSizeMb * 1024 * 1024,
    files: config.aws.maxFiles,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      !allowedExtensions.has(extension) ||
      !allowedMimeTypes.has(file.mimetype)
    ) {
      return callback(
        new BadRequestException(
          'Only JPEG, PNG, GIF, WebP, MP4, MOV, AVI, MKV, CSV, and PDF files are allowed',
        ),
        false,
      );
    }
    callback(null, true);
  },
};

export interface UploadedFile {
  url: string;
  public_id: string;
}

const buildPublicUrl = (key: string): string => {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  if (config.aws.publicBaseUrl) {
    return `${config.aws.publicBaseUrl.replace(/\/$/, '')}/${encodedKey}`;
  }
  return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${encodedKey}`;
};

const uploadToS3 = async (file: Express.Multer.File): Promise<UploadedFile> => {
  if (!file?.buffer) throw new BadRequestException('No file provided');
  assertAwsConfig();

  const key = `${config.aws.folder}/${randomUUID()}-${sanitizeFileName(file.originalname)}`;
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.aws.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024,
      leavePartsOnError: false,
    });
    await upload.done();
    return { url: buildPublicUrl(key), public_id: key };
  } catch (error) {
    console.error('S3 upload failed', error);
    throw new ServiceUnavailableException(
      'File upload is temporarily unavailable',
    );
  }
};

const deleteFromS3 = async (key: string): Promise<void> => {
  if (!key) return;
  assertAwsConfig();
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: key }),
    );
  } catch (error) {
    console.error('S3 delete failed', error);
    throw new ServiceUnavailableException(
      'File deletion is temporarily unavailable',
    );
  }
};

export const fileUpload = { uploadConfig, uploadToS3, deleteFromS3 };
