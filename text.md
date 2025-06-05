# Recommended for most uses
DATABASE_URL=postgres://neondb_owner:npg_Z0wdXg6knSvy@ep-blue-glitter-a4xc1mko-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Z0wdXg6knSvy@ep-blue-glitter-a4xc1mko.us-east-1.aws.neon.tech/neondb?sslmode=require

# Parameters for constructing your own connection string
PGHOST=ep-blue-glitter-a4xc1mko-pooler.us-east-1.aws.neon.tech
PGHOST_UNPOOLED=ep-blue-glitter-a4xc1mko.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_Z0wdXg6knSvy

# Parameters for Vercel Postgres Templates
POSTGRES_URL=postgres://neondb_owner:npg_Z0wdXg6knSvy@ep-blue-glitter-a4xc1mko-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_Z0wdXg6knSvy@ep-blue-glitter-a4xc1mko.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-blue-glitter-a4xc1mko-pooler.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=npg_Z0wdXg6knSvy
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgres://neondb_owner:npg_Z0wdXg6knSvy@ep-blue-glitter-a4xc1mko-pooler.us-east-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_Z0wdXg6knSvy@ep-blue-glitter-a4xc1mko-pooler.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=70ec2ef7-84bb-4af5-8658-5558c65d8b64
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_kq3pbqffcvhqey2dyed85rm365mbygzv988h9hcwaxc28
STACK_SECRET_SERVER_KEY=ssk_x3s92g6sss2w8qdn7kd5a18a584x1ye38r9pd28g1qj10