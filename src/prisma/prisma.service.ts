import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Establish a standard, robust native connection pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // 2. Instantiate Prisma 7 using the mandatory Driver Adapter pattern
    const adapter = new PrismaPg(pool);

    // 3. Hand the adapter configuration straight to the base engine constructor
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connection established through native PG Driver Adapter!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

}