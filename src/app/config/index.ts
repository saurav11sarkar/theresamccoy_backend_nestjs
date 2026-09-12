import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default {
  appName: process.env.APP_NAME || 'NestJS Boilerplate MongoDB',
  port: toNumber(process.env.PORT, 3000),
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  mongoUri:
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nestjs_boilerplate',
  isMongoEnabled: true,
  bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 10),
  jwt: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-jwt-secret',
    jwtExpire: process.env.JWT_EXPIRE,
    accessTokenSecret:
      process.env.ACCESS_TOKEN_SECRET || 'change-me-access-token-secret',
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '7d',
    refreshTokenSecret:
      process.env.REFRESH_TOKEN_SECRET || 'change-me-refresh-token-secret',
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '90d',
  },
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'nestjs-boilerplate',
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_BUCKET_NAME || process.env.AWS_BUCKET,
    folder: (process.env.AWS_UPLOAD_FOLDER || 'uploads').replace(
      /^\/+|\/+$/g,
      '',
    ),
    publicBaseUrl: process.env.AWS_PUBLIC_BASE_URL,
    maxFileSizeMb: toNumber(process.env.AWS_MAX_FILE_SIZE_MB, 50),
    maxFiles: toNumber(process.env.AWS_MAX_FILES, 3),
  },
  email: {
    expires: process.env.EMAIL_EXPIRES,
    host: process.env.EMAIL_HOST,
    port: toNumber(process.env.EMAIL_PORT, 587),
    address: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    admin: process.env.ADMIN_EMAIL,
    senderName: process.env.EMAIL_SENDER_NAME || 'NestJS Boilerplate',
  },
  stripe: {
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
};
