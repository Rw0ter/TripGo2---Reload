import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // 业务模块在此注册：AuthModule, TripsModule, OrdersModule, ...
  ],
  controllers: [AppController],
})
export class AppModule {}
