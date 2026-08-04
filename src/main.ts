import * as dotenv from 'dotenv';
import * as path from 'path';

import { setDefaultResultOrder } from 'node:dns';

// 🎯 FORCE NODE TO USE IPv4 FIRST (Fixes Render IPv6 ENETUNREACH on Gmail/OAuth2)
setDefaultResultOrder('ipv4first');

// 🔌 Explicitly target the root directory .env file, bypassing the 'dist/' folder mixup!
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.setGlobalPrefix('api');

  console.log('🚀 Backend gateway actively listening on http://localhost:3000');
  await app.listen(3000);
}
bootstrap();

