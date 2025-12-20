import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { PlaylistsService } from './playlists.service'

@Controller('api/playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  getAllPlaylists(@Query('user_id') userId: string) {
    return this.playlistsService.getAllPlaylists(userId)
  }

  @Get(':id')
  getPlaylistById(@Param('id') id: string) {
    return this.playlistsService.getPlaylistById(id)
  }

  @Post()
  createPlaylist(@Body() body: any) {
    return this.playlistsService.createPlaylist(body)
  }

  @Put(':id')
  updatePlaylist(@Param('id') id: string, @Body() body: any) {
    return this.playlistsService.updatePlaylist(id, body)
  }

  @Delete(':id')
  deletePlaylist(@Param('id') id: string) {
    return this.playlistsService.deletePlaylist(id)
  }

  @Post(':id/items')
  addItemToPlaylist(@Param('id') id: string, @Body() body: any) {
    return this.playlistsService.addItemToPlaylist(id, body)
  }

  @Delete(':id/items/:itemId')
  removeItemFromPlaylist(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.playlistsService.removeItemFromPlaylist(id, itemId)
  }
}
