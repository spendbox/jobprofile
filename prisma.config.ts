import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Pooled connection (transaction mode, port 6543) — for runtime queries
  // Migrations override this with DIRECT_URL via the vercel-build script
  datasource: {
    url: process.env['DATABASE_URL'],
  },
})
