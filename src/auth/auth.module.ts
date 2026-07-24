import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 Import your global prisma module layer

@Module({
  imports: [PrismaModule], // 👈 Register it here so AuthService can use Prisma!
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}