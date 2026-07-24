


import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule,   // Handles global Prisma database connections
    OrdersModule,   // Handles order management endpoints (/api/orders)
    AuthModule,     // Handles authentication endpoints (/api/auth)
  ], 
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}