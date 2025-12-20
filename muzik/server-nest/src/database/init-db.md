Below is the **clean, production-ready way to connect a Supabase database to a NestJS project deployed on Vercel**. I’ll cover **local → production**, **security**, and **common pitfalls**.

---

## 1️⃣ Get Supabase connection credentials

From **Supabase Dashboard → Project Settings → Database**:

You’ll need **ONE** of these (choose based on use case):

### ✅ Recommended (Direct PostgreSQL connection)

```
Host: db.xxxxx.supabase.co
Database: postgres
User: postgres
Password: <your-password>
Port: 5432
```

Or full connection string:

```
postgresql://postgres:<password>@db.xxxxx.supabase.co:5432/postgres
```

> ⚠️ Use **Connection Pooling** if you expect many requests (Vercel is serverless).

---

## 2️⃣ Choose connection strategy (IMPORTANT for Vercel)

### 🔥 Best option for Vercel (Serverless)

Use **Supabase Connection Pooler** (PgBouncer)

From Supabase:

```
postgresql://postgres:<password>@aws-0-xxx.pooler.supabase.com:6543/postgres
```

Why?

* Prevents **too many connections**
* Required for serverless platforms like **Vercel**

---

## 3️⃣ Install database dependencies in NestJS

### Using TypeORM (most common)

```bash
npm install @nestjs/typeorm typeorm pg
```

OR Prisma (better DX):

```bash
npm install prisma @prisma/client
```

(I’ll show **TypeORM first**, then Prisma)

---

## 4️⃣ Configure environment variables (Vercel compatible)

### `.env` (local)

```env
DATABASE_URL=postgresql://postgres:<password>@aws-0-xxx.pooler.supabase.com:6543/postgres
```

### Vercel

Go to:

> **Vercel Dashboard → Project → Settings → Environment Variables**

Add:

```
DATABASE_URL = postgresql://postgres:<password>@aws-0-xxx.pooler.supabase.com:6543/postgres
```

✔️ Set for **Production + Preview**

---

## 5️⃣ Configure NestJS with TypeORM

### `app.module.ts`

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, // ❗ NEVER true in production
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  ],
})
export class AppModule {}
```

### ⚠️ Notes

* `ssl` is REQUIRED for Supabase
* `synchronize: false` (use migrations)
* `autoLoadEntities` works well for NestJS modular design

---

## 6️⃣ Entity example

```ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ default: true })
  isActive: boolean;
}
```

Then register:

```ts
TypeOrmModule.forFeature([User])
```

---

## 7️⃣ Vercel deployment setup for NestJS

### `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ]
}
```

### Build command

```bash
npm run build
```

### Output

```bash
dist/main.js
```

---

## 8️⃣ Prisma alternative (HIGHLY recommended)

### Install & init

```bash
npx prisma init
```

### `schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### Generate client

```bash
npx prisma generate
```

### NestJS Prisma Service

```ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

Prisma works **much better with Supabase + Vercel** than TypeORM.

---

## 9️⃣ Common mistakes (avoid these 🚨)

❌ Using **direct DB connection** instead of pooler
❌ Forgetting `ssl: { rejectUnauthorized: false }`
❌ `synchronize: true` in production
❌ Not limiting connections (serverless crash)
❌ Putting DB password in frontend env vars

---

## 10️⃣ Architecture best practice (Recommended)

```
Frontend (Vercel)
   ↓
NestJS API (Vercel / Railway / Fly.io)
   ↓
Supabase PostgreSQL (Pooler)
```

👉 **Do NOT connect Supabase DB directly from frontend**

---

## 11️⃣ Want Supabase Auth + NestJS?

Since you’re already deep into **auth systems (Azure AD B2C, JWT, OAuth)**, a great setup is:

* Supabase Auth for social login
* NestJS validates Supabase JWT
* RBAC handled in NestJS

If you want, I can show:

* Supabase Auth → NestJS JWT validation
* Prisma schema for Supabase tables
* Connection pooling tuning for Vercel
* Monorepo setup (Frontend + NestJS)

Just tell me 👍
