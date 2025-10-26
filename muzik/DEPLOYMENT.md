# Muzik Deployment Guide

This guide will help you deploy the Muzik app to Vercel with Supabase as the database.

## Architecture

- **Frontend (Vue.js)**: Deployed on Vercel
- **Backend (Express)**: Deployed on Vercel as serverless functions
- **Database**: Supabase (PostgreSQL)

## Prerequisites

1. GitHub account
2. Vercel account (free tier: [vercel.com](https://vercel.com))
3. Supabase account (free tier: [supabase.com](https://supabase.com))

## Step 1: Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Name: `muzik`
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
4. Wait for the project to be created (about 2 minutes)

5. Go to **SQL Editor** in the left sidebar
6. Click "New query"
7. Copy and paste the contents of `server/supabase-setup.sql`
8. Click "Run" (or press Ctrl/Cmd + Enter)
9. You should see "Database setup complete!"

10. Go to **Settings** → **Database**
11. Find "Connection string" section
12. Under **Connection pooling**, copy the URI
    - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
13. Save this for Step 3

## Step 2: Prepare Your Code

1. Create a `.env` file in the `server` folder:
```bash
cd server
cp env.example .env
```

2. Edit `server/.env` and add your Supabase connection string:
```env
DB_TYPE=postgresql
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

3. Update `muzik/vercel.json` with your server URL (after deployment):
```json
{
  "env": {
    "VITE_API_URL": "https://your-server-name.vercel.app/api"
  }
}
```

4. Push to GitHub if you haven't already:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Step 3: Deploy Backend Server

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your repository
4. Click **"Configure Project"**
5. Set:
   - **Root Directory**: `server`
   - **Framework Preset**: None
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
6. Click **"Environment Variables"** and add:
   - `DB_TYPE` = `postgresql`
   - `DATABASE_URL` = (your Supabase connection string from Step 1)
7. Click **"Deploy"**
8. Wait for deployment (about 2 minutes)
9. Copy the deployment URL (e.g., `https://muzik-server.vercel.app`)

## Step 4: Deploy Frontend

1. In Vercel, click **"New Project"** again
2. Import the same repository (or create a separate repo for frontend)
3. Click **"Configure Project"**
4. Set:
   - **Root Directory**: `muzik` (or root if it's already at root)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Environment Variables"** and add:
   - `VITE_API_URL` = `https://your-backend-url.vercel.app/api`
     (Use the URL from Step 3)
6. Click **"Deploy"**

## Step 5: Update Frontend with Backend URL

If you haven't set the environment variable correctly:

1. Go to your frontend project in Vercel
2. Click **Settings** → **Environment Variables**
3. Update `VITE_API_URL` with your backend URL
4. Redeploy: Go to **Deployments** → Click **"..."** → **"Redeploy"**

## Testing

1. Visit your frontend URL (e.g., `https://muzik-app.vercel.app`)
2. Try adding a YouTube video
3. Check that it works!

## Troubleshooting

### Backend Issues

- **Database connection error**: Check that your `DATABASE_URL` is correct in Vercel
- **Table not found**: Run the SQL setup again in Supabase
- **CORS errors**: Make sure CORS is enabled in server.js (it is by default)

### Frontend Issues

- **API not connecting**: Check that `VITE_API_URL` is correct
- **Build errors**: Make sure you're using the correct root directory

### Check Logs

1. In Vercel, go to your project
2. Click **Deployments** → Click on a deployment
3. Click **"View Build Logs"** to see any errors

## Environment Variables Reference

### Backend (`server/.env`)
```env
DB_TYPE=postgresql
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
```

### Frontend (`muzik/.env.production`)
```env
VITE_API_URL=https://your-backend.vercel.app/api
```

## Updates

To update your deployment:
1. Make changes to your code
2. Commit and push to GitHub
3. Vercel will automatically redeploy

## Cost

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Supabase**: Free tier includes 500MB database, 500MB storage
- Both are sufficient for a personal/moderate-use app

