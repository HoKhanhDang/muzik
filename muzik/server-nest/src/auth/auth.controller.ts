import { Controller, Post, Body, Get, Req, Headers, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import * as jwt from 'jsonwebtoken'

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body)
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body)
  }

  @Get('me')
  getProfile(@Headers('authorization') authHeader: string) {
    // Simple manual JWT middleware replacement for this specific route
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token')
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      )
      return this.authService.getProfile(decoded.userId)
    } catch (err) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
