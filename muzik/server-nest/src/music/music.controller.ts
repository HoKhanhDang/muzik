import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { MusicService } from './music.service'

@Controller('api/music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get()
  getAllMusic(@Query('user_id') userId: string) {
    return this.musicService.getAllMusic(userId)
  }

  @Get(':id')
  getMusicById(@Param('id') id: string) {
    return this.musicService.getMusicById(id)
  }

  @Post()
  createMusic(@Body() body: any) {
    return this.musicService.createMusic(body)
  }

  @Put(':id')
  updateMusic(@Param('id') id: string, @Body() body: any) {
    return this.musicService.updateMusic(id, body)
  }

  @Delete(':id')
  deleteMusic(@Param('id') id: string) {
    return this.musicService.deleteMusic(id)
  }
}
