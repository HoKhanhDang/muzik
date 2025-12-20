# ⚠️ IMPORTANT: Supabase Connection for Vercel

## Current Issue

You are using **direct database connection**:

```
db.ajlwxqahtbrreixzvcoe.supabase.co:5432
```

## ✅ Solution: Use Connection Pooler

### Step 1: Get Pooler URL from Supabase

1. Go to **Supabase Dashboard**
2. Navigate to **Project Settings → Database**
3. Scroll to **Connection Pooling** section
4. Copy the **Transaction Mode** connection string:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 2: Update Environment Variables

#### Local (.env)

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### Vercel Dashboard

1. Go to **Settings → Environment Variables**
2. Update `DATABASE_URL` with the **pooler URL** (port 6543, not 5432)
3. Redeploy

### Why This Matters

- **Direct connection (5432)**: Limited to ~60 concurrent connections
- **Pooler (6543)**: Handles thousands via PgBouncer
- **Vercel serverless**: Each function instance = new connection
- **Without pooler**: You'll hit "too many connections" error

### Current Connection Config (database.service.ts)

```typescript
this.db = new Pool({
  connectionString: this.configService.get<string>('DATABASE_URL'),
  ssl: { rejectUnauthorized: false },
  max: 1, // ✅ Good for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
```

The `max: 1` is correct for serverless, but you MUST use the pooler URL.
