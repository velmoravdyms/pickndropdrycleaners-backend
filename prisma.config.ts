

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config'; // 👈 Must be prisma/config, not just prisma

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});