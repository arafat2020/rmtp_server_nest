import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MediaServerModule } from '@live-stream/media-server';

async function bootstrap() {
    const app = await NestFactory.create(MediaServerModule);

    const port = process.env.PORT || 8000;
    await app.listen(port);

    Logger.log(`🚀 Media Server (HTTP/API) is running on: http://localhost:${port}`);
    Logger.log(`🚀 RTMP Server is running on: rtmp://localhost:1935`);
}

bootstrap();
