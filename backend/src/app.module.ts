import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { CulturalModule } from './modules/cultural/cultural.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ScenicModule } from './modules/scenic/scenic.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { MessagesModule } from './modules/messages/messages.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SearchModule } from './modules/search/search.module';
import { StoriesModule } from './modules/stories/stories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { TripsModule } from './modules/trips/trips.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    AuthModule,
    CulturalModule,
    DestinationsModule,
    FavoritesModule,
    ReviewsModule,
    ScenicModule,
    BannersModule,
    QuizModule,
    CheckinModule,
    LeaderboardModule,
    MessagesModule,
    OrdersModule,
    SearchModule,
    StoriesModule,
    TransactionsModule,
    TripsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
