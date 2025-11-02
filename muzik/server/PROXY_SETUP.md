# YouTube API Proxy Setup

Proxy endpoint này giúp bypass các hạn chế của proxy công ty khi load YouTube API.

## Cách hoạt động

Thay vì load trực tiếp từ `https://www.youtube.com/iframe_api`, frontend sẽ load qua backend proxy endpoint `/api/proxy/youtube-api`. Backend server sẽ fetch YouTube API và trả về cho client, giúp bypass proxy restrictions.

## Cấu hình

### 1. Tạo file `.env` trong folder `muzik/` (frontend)

```env
# API URL Configuration
VITE_API_URL=http://localhost:3001/api

# Enable proxy cho YouTube API
# Set to 'true' hoặc '1' để bật proxy
VITE_USE_PROXY=true
```

### 2. Khởi động server

```bash
cd server
npm start
```

### 3. Test proxy endpoint

Kiểm tra proxy có hoạt động:

```bash
curl http://localhost:3001/api/proxy/youtube-api
```

Hoặc mở browser:
```
http://localhost:3001/api/proxy/youtube-api
```

### 4. Khởi động frontend

```bash
cd muzik
npm run dev
```

## Flow hoạt động

1. Frontend check `VITE_USE_PROXY` trong `.env`
2. Nếu `true`: Load YouTube API qua `/api/proxy/youtube-api`
3. Backend fetch từ YouTube và trả về
4. Nếu proxy fail, tự động fallback về direct connection
5. YouTube API load thành công, video player hoạt động bình thường

## Troubleshooting

### Proxy không hoạt động

1. Kiểm tra server đang chạy:
   ```bash
   curl http://localhost:3001/health
   ```

2. Kiểm tra proxy endpoint:
   ```bash
   curl http://localhost:3001/api/proxy/health
   ```

3. Kiểm tra logs trong console của browser - sẽ có thông báo về method đang sử dụng

### Vẫn bị block

1. Đảm bảo `VITE_USE_PROXY=true` trong `.env`
2. Restart cả server và frontend sau khi thay đổi `.env`
3. Clear browser cache và reload
4. Kiểm tra network tab trong DevTools để xem request có đi qua proxy không

### Production deployment

Khi deploy lên production (Vercel, etc.):

1. Set environment variable `VITE_USE_PROXY=true` trong Vercel dashboard
2. Đảm bảo `VITE_API_URL` trỏ đúng backend URL
3. Redeploy frontend sau khi set env vars

