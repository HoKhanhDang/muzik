# YouTube API Proxy Setup

This proxy endpoint helps bypass company proxy restrictions when loading the YouTube API.

## How It Works

Instead of loading directly from `https://www.youtube.com/iframe_api`, the frontend will load through the backend proxy endpoint `/api/proxy/youtube-api`. The backend server will fetch the YouTube API and return it to the client, helping bypass proxy restrictions.

## Configuration

### 1. Create `.env` file in the `muzik/` folder (frontend)

```env
# API URL Configuration
VITE_API_URL=http://localhost:3001/api

# Enable proxy for YouTube API
# Set to 'true' or '1' to enable proxy
VITE_USE_PROXY=true
```

### 2. Start the server

```bash
cd server
npm start
```

### 3. Test proxy endpoint

Check if proxy is working:

```bash
curl http://localhost:3001/api/proxy/youtube-api
```

Or open in browser:
```
http://localhost:3001/api/proxy/youtube-api
```

### 4. Start the frontend

```bash
cd muzik
npm run dev
```

## How It Works

1. Frontend checks `VITE_USE_PROXY` in `.env`
2. If `true`: Load YouTube API through `/api/proxy/youtube-api`
3. Backend fetches from YouTube and returns it
4. If proxy fails, automatically fallback to direct connection
5. YouTube API loads successfully, video player works normally

## Troubleshooting

### Proxy not working

1. Check if server is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check proxy endpoint:
   ```bash
   curl http://localhost:3001/api/proxy/health
   ```

3. Check logs in browser console - there will be messages about the method being used

### Still blocked

1. Ensure `VITE_USE_PROXY=true` in `.env`
2. Restart both server and frontend after changing `.env`
3. Clear browser cache and reload
4. Check network tab in DevTools to see if request goes through proxy

### Production deployment

When deploying to production (Vercel, etc.):

1. Set environment variable `VITE_USE_PROXY=true` in Vercel dashboard
2. Ensure `VITE_API_URL` points to the correct backend URL
3. Redeploy frontend after setting env vars


