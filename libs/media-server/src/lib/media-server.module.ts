import { Module } from '@nestjs/common';
import { RtmpService } from './rtmp.service.js';
import { StreamManagerService } from './stream-manager.service.js';

@Module({
    providers: [RtmpService, StreamManagerService],
    exports: [RtmpService, StreamManagerService],
})
export class MediaServerModule { }
