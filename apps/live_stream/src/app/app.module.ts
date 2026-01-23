import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { ZodFilter } from '@live-stream/shared-zod';

import { DatabaseModule, DRIZZLE } from '@live-stream/database';
import { AuthModule } from '@live-stream/auth';

@Module({
  imports: [
    DatabaseModule.forRoot({
      token: DRIZZLE,
      url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/dbname',
    }),
    AuthModule,
  ],
  controllers: [AppController, TestController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ZodFilter,
    },
  ],
})
export class AppModule { }
