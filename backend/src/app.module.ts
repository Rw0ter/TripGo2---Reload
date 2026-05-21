import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ScenicModule } from './modules/scenic/scenic.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DestinationsModule,
    ScenicModule,
    BannersModule,
    QuizModule,
    // 业务模块在此注册：TripsModule, OrdersModule, ...
  ],
  controllers: [AppController],
})
export class AppModule {}
