/**
 * RTMP protocol constants and interfaces.
 * RTMP (Real-Time Messaging Protocol) is used for streaming audio, video, and data
 * over the internet, between a Flash player and a server.
 */

/**
 * RTMP Handshake constants.
 * The handshake is the first thing that happens when a client connects.
 * It consists of 3 packets sent by the client (C0, C1, C2) and 3 by the server (S0, S1, S2).
 */
export enum RTMP_HANDSHAKE {
    /** The size of the random data packet in the handshake (1536 bytes) */
    SIZE = 1536,
    /** The standard RTMP version used (3) */
    VERSION = 3,
}

/**
 * RTMP Chunks are how larger messages are broken down for transmission.
 * The FMT (Format) determines how much of the header is repeated.
 */
export enum RTMP_CHUNK_TYPE {
    /** Full 11-byte header: includes timestamp, length, type, and stream ID. */
    TYPE_0 = 0,
    /** 7-byte header: relative timestamp, length, and type. ID is same as previous. */
    TYPE_1 = 1,
    /** 3-byte header: only relative timestamp. ID, length, and type are same as previous. */
    TYPE_2 = 2,
    /** 0-byte header: complete continuation of previous chunk. */
    TYPE_3 = 3,
}

/**
 * Different types of messages that can be sent over RTMP.
 */
export enum RTMP_MESSAGE_TYPE {
    CHUNK_SIZE = 1,
    ABORT = 2,
    ACKNOWLEDGEMENT = 3,
    USER_CONTROL = 4,
    WINDOW_ACKNOWLEDGEMENT_SIZE = 5,
    SET_PEER_BANDWIDTH = 6,
    AUDIO = 8,
    VIDEO = 9,
    DATA_AMF3 = 15,
    SHARED_OBJECT_AMF3 = 16,
    COMMAND_AMF3 = 17,
    DATA_AMF0 = 18,
    SHARED_OBJECT_AMF0 = 19,
    /** Most common for control logic like 'connect', 'publish', 'play' */
    COMMAND_AMF0 = 20,
    AGGREGATE = 22,
}

/**
 * Internal representation of a single RTMP data chunk.
 */
export interface RTMPChunk {
    header: {
        chunkStreamId: number;
        timestamp: number;
        messageLength: number;
        messageTypeId: number;
        messageStreamId: number;
        fmt: RTMP_CHUNK_TYPE;
        timestampDelta: number;
    };
    payload: Buffer;
}

/**
 * A full RTMP message, which might be reconstructed from multiple chunks.
 */
export interface RTMPMessage {
    chunkStreamId: number;
    timestamp: number;
    messageLength: number;
    messageTypeId: RTMP_MESSAGE_TYPE;
    messageStreamId: number;
    payload: Buffer;
}

/**
 * The state machine for a single connection.
 */
export enum RTMP_SESSION_STATE {
    /** Waiting for version byte (C0) */
    HANDSHAKE_0 = 0,
    /** Waiting for random data packet (C1) */
    HANDSHAKE_1 = 1,
    /** Waiting for acknowledgment of our random data (C2) */
    HANDSHAKE_2 = 2,
    /** Handshake done, exchanging protocol control messages */
    CONNECTING = 3,
    /** Fully connected, ready to stream */
    CONNECTED = 4,
}
