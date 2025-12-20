import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { VideosService } from './videos.service'

@Controller('api/videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  getAllVideos(@Query('user_id') userId: string) {
    return this.videosService.getAllVideos(userId)
  }

  @Get('ids')
  getVideoIds(@Query('user_id') userId: string) {
    return this.videosService.getVideoIds(userId)
  }

  @Get(':id')
  getVideoById(@Param('id') id: string) {
    return this.videosService.getVideoById(id)
  }

  @Post()
  createVideo(@Body() body: any) {
    return this.videosService.createVideo(body)
  }

  @Put(':id')
  updateVideo(@Param('id') id: string, @Body() body: any) {
    return this.videosService.updateVideo(id, body)
  }

  @Delete(':id')
  deleteVideo(@Param('id') id: string) {
    return this.videosService.deleteVideo(id)
  }
}
