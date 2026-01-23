import * as net from 'net';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { RTMP_HANDSHAKE, RTMP_SESSION_STATE } from './interfaces.js';

/**
 * Represents a single RTMP connection (session).
 * It handles the low-level lifecycle of a connection, starting from the 
 * RTMP handshake to processing incoming streaming data (chunks).
 */
export class RtmpSession {
    private readonly logger = new Logger(RtmpSession.name);

    /** Current state of the connection's handshake/logic */
    private state: RTMP_SESSION_STATE = RTMP_SESSION_STATE.HANDSHAKE_0;

    /** Unique identifier for this session */
    public id: string;

    /**
     * @param socket The raw TCP socket from the net.Server
     */
    constructor(private socket: net.Socket) {
        this.id = crypto.randomBytes(8).toString('hex');

        /** Listen for raw data incoming from the client (OBS, VLC, etc.) */
        this.socket.on('data', this.onData.bind(this));
        /** Handle when the client disconnects */
        this.socket.on('end', this.onEnd.bind(this));
        /** Handle socket errors to prevent the server from crashing */
        this.socket.on('error', this.onError.bind(this));
    }

    /**
     * Entry point for all data coming from the socket.
     * RTMP is a binary protocol, so we receive data as 'Buffer' chunks.
     */
    private onData(data: Buffer) {
        switch (this.state) {
            case RTMP_SESSION_STATE.HANDSHAKE_0:
                /** Step 1: Handle RTMP Version (C0) and Random Data (C1) */
                this.handleHandshake01(data);
                break;
            case RTMP_SESSION_STATE.HANDSHAKE_2:
                /** Step 2: Handle client's acknowledgment of our handshake (C2) */
                this.handleHandshake2(data);
                break;
            default:
                /** Step 3: Parse RTMP Chunks once handshake is complete */
                this.processChunks(data);
                break;
        }
    }

    /**
     * Processes RTMP Handshake C0 and C1.
     * C0 is 1 byte (version), C1 is 1536 bytes (random data).
     */
    private handleHandshake01(data: Buffer) {
        /** We need at least 1537 bytes (1 for C0, 1536 for C1) */
        if (data.length < RTMP_HANDSHAKE.SIZE + 1) return;

        /** Verify the RTMP version (should be 3) */
        const version = data.readUInt8(0);
        if (version !== RTMP_HANDSHAKE.VERSION) {
            this.logger.error(`Unsupported RTMP version: ${version}`);
            this.socket.end();
            return;
        }

        const c1 = data.slice(1, RTMP_HANDSHAKE.SIZE + 1);

        /** 
         * Respond with S0 (version), S1 (our random data), and S2 (echo of client's C1) 
         */
        const s0 = Buffer.from([RTMP_HANDSHAKE.VERSION]);
        const s1 = crypto.randomBytes(RTMP_HANDSHAKE.SIZE);
        s1.writeUInt32BE(0, 0); // timestamp
        s1.writeUInt32BE(0, 4); // zero marker

        const s2 = c1; // S2 is exactly what the client sent in C1

        /** Send S0+S1+S2 in one go */
        this.socket.write(Buffer.concat([s0, s1, s2]));

        /** Move to next state: waiting for the client to send C2 */
        this.state = RTMP_SESSION_STATE.HANDSHAKE_2;
    }

    /**
     * Final step of the RTMP Handshake.
     * Client sends C2 as an acknowledgment of our S1.
     */
    private handleHandshake2(data: Buffer) {
        /** C2 is 1536 bytes */
        if (data.length < RTMP_HANDSHAKE.SIZE) return;

        /** Handshake is now fully complete! */
        this.state = RTMP_SESSION_STATE.CONNECTED;
        this.logger.log(`Handshake complete for session ${this.id}`);
    }

    /**
     * This is where the real work happens after the handshake.
     * RTMP messages (video, audio, commands) are split into 'chunks'.
     */
    private processChunks(data: Buffer) {
        /**
         * TODO: Implement logic to:
         * 1. Read Chunk Basic Header (Type and Stream ID)
         * 2. Read Chunk Message Header (Timestamp, Length, Type)
         * 3. Reconstruct full messages from chunks
         * 4. Route video/audio to subscribers
         */
    }

    private onEnd() {
        this.logger.log(`Connection ended for session: ${this.id}`);
    }

    private onError(err: Error) {
        this.logger.error(`Socket error for session ${this.id}: ${err.message}`);
    }
}
