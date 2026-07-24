import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 🌍 This decorator means we only import it once in app.module.ts, and it's available everywhere!
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
