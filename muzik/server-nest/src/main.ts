import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { INestApplication } from '@nestjs/common'

let cachedApp: INestApplication

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  await app.init()
  return app
}

// For local development
if (require.main === module) {
  bootstrap().then(async (app) => {
    const port = process.env.PORT || 3001
    await app.listen(port)
    console.log(`Server running on http://localhost:${port}`)
  })
}

// For Vercel serverless - cache app instance
export default async (req, res) => {
  if (!cachedApp) {
    cachedApp = await bootstrap()
  }
  const expressApp = cachedApp.getHttpAdapter().getInstance()
  return expressApp(req, res)
}
