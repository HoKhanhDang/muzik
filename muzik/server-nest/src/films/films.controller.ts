import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { FilmsService } from './films.service'

@Controller('api/films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Get()
  getAllFilms(@Query('user_id') userId: string) {
    return this.filmsService.getAllFilms(userId)
  }

  @Get(':id')
  getFilmById(@Param('id') id: string) {
    return this.filmsService.getFilmById(id)
  }

  @Post()
  createFilm(@Body() body: any) {
    return this.filmsService.createFilm(body)
  }

  @Put(':id')
  updateFilm(@Param('id') id: string, @Body() body: any) {
    return this.filmsService.updateFilm(id, body)
  }

  @Delete(':id')
  deleteFilm(@Param('id') id: string) {
    return this.filmsService.deleteFilm(id)
  }
}
