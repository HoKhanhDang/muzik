import { Controller, Get, Query, Res } from '@nestjs/common'
import { ProxyService } from './proxy.service'
import { Response } from 'express'

@Controller('api/proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('youtube-api')
  async getYoutubeApi(@Res() res: Response) {
    return this.proxyService.proxyYoutubeApi(res)
  }

  @Get('youtube-search')
  async searchYoutube(
    @Query('q') q: string,
    @Query('maxResults') maxResults: number,
    @Res() res: Response,
  ) {
    return this.proxyService.searchYoutube(q, maxResults, res)
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'proxy',
      timestamp: new Date().toISOString(),
    }
  }
}
