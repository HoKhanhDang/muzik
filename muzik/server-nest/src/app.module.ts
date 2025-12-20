import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { VideosModule } from './videos/videos.module'
import { AuthModule } from './auth/auth.module'
import { FilmsModule } from './films/films.module'
import { MusicModule } from './music/music.module'
import { PlaylistsModule } from './playlists/playlists.module'
import { ProxyModule } from './proxy/proxy.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    VideosModule,
    AuthModule,
    FilmsModule,
    MusicModule,
    PlaylistsModule,
    ProxyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
