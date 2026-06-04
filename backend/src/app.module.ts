import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ScenicModule } from './modules/scenic/scenic.module';
import { SearchModule } from './modules/search/search.module';
import { StoriesModule } from './modules/stories/stories.module';
import { TripsModule } from './modules/trips/trips.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DestinationsModule,
    ScenicModule,
    BannersModule,
    QuizModule,
    SearchModule,
    StoriesModule,
    TripsModule,
    // 业务模块在此注册：OrdersModule, ...
  ],
  controllers: [AppController],
})
export class AppModule {}
