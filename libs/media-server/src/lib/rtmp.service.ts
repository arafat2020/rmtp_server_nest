import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as net from 'net';
import { RtmpSession } from './rtmp.session.js';
import { StreamManagerService } from './stream-manager.service.js';

/**
 * The RtmpService is the main entry point for the RTMP server.
 * It starts a TCP server and listens for incoming connections from streaming software (like OBS).
 */
@Injectable()
export class RtmpService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RtmpService.name);

    /** The raw Node.js TCP server instance */
    private server: net.Server | null = null;

    /** Registry of all active connection sessions */
    private sessions = new Map<string, RtmpSession>();

    /**
     * @param streamManager DI injection of the stream manager to handle routing
     */
    constructor(public readonly streamManager: StreamManagerService) { }

    /**
     * NestJS Lifecycle Hook: Automatically called when the module starts.
     * We start the RTMP server here.
     */
    onModuleInit() {
        this.startServer();
    }

    /**
     * NestJS Lifecycle Hook: Automatically called when the module is destroyed.
     * We shut down the RTMP server cleanly here.
     */
    onModuleDestroy() {
        this.stopServer();
    }

    /**
     * Starts the TCP server on the default RTMP port (1935).
     */
    private startServer() {
        this.server = net.createServer((socket) => {
            /** 
             * Every new connection from a client (OBS, VLC) creates a new 'RtmpSession' 
             */
            const session = new RtmpSession(socket);
            this.sessions.set(session.id, session);
            this.logger.log(`New RTMP session started: ${session.id}. Total active: ${this.sessions.size}`);

            /** Clean up the session when the socket closes */
            socket.on('close', () => {
                this.sessions.delete(session.id);
                this.logger.log(`RTMP session closed: ${session.id}. Remaining active: ${this.sessions.size}`);
            });
        });

        const port = 1935;
        this.server.listen(port, () => {
            this.logger.log(`RTMP (Media) Server is listening on port ${port}`);
            this.logger.log(`Accepting connections at rtmp://localhost:${port}`);
        });
    }

    /**
     * Stops the TCP server and closes all listeners.
     */
    private stopServer() {
        if (this.server) {
            this.server.close();
            this.logger.log('RTMP Server has been successfully stopped');
        }
    }
}
