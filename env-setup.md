# Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cqhjgbbsdiuspyxxwdah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4W-3CGCxlcu7OUc5VNvR4Q_vKfXgSIf

# Database URLs (Supabase PostgreSQL)
# Get these from Supabase Dashboard > Settings > Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.cqhjgbbsdiuspyxxwdah.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.cqhjgbbsdiuspyxxwdah.supabase.co:5432/postgres"
```

Replace `[YOUR-PASSWORD]` with your actual Supabase database password.
