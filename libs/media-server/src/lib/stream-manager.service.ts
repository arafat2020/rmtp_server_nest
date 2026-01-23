import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

/**
 * Data associated with an active stream.
 */
export interface StreamData {
    /** Combined app/streamName identifier */
    streamId: string;
    /** The RTMP application name (e.g., 'live') */
    app: string;
    /** The actual stream name (e.g., 'test') */
    streamName: string;
    /** Internal session ID of the publisher */
    publisherId: string;
}

/**
 * Service responsible for tracking who is publishing and who is watching.
 * It acts as a central registry for all active media streams in the server.
 */
@Injectable()
export class StreamManagerService {
    private readonly logger = new Logger(StreamManagerService.name);

    /** Map of active streams being published. Key: "app/streamName" */
    private publishers = new Map<string, StreamData>();

    /** Map of active viewers for each stream. Key: "app/streamName", Value: Set of session IDs */
    private subscribers = new Map<string, Set<string>>();

    /** 
     * Observable stream of events. Use this to listen for new publishers 
     * or when a stream goes offline.
     */
    public streamEvents$ = new Subject<{ type: 'publish' | 'unpublish' | 'play' | 'stop'; data: StreamData }>();

    /**
     * Registers a new publisher for a specific stream.
     * @returns true if added successfully, false if someone is already publishing to this name.
     */
    addPublisher(app: string, streamName: string, sessionId: string) {
        const key = `${app}/${streamName}`;
        if (this.publishers.has(key)) {
            this.logger.warn(`Publisher already exists for ${key}`);
            return false;
        }
        const data: StreamData = { streamId: key, app, streamName, publisherId: sessionId };
        this.publishers.set(key, data);
        this.streamEvents$.next({ type: 'publish', data });
        this.logger.log(`Publisher added: ${key}`);
        return true;
    }

    /**
     * Removes a publisher and notifies all observers.
     */
    removePublisher(app: string, streamName: string) {
        const key = `${app}/${streamName}`;
        const data = this.publishers.get(key);
        if (data) {
            this.publishers.delete(key);
            this.streamEvents$.next({ type: 'unpublish', data });
            this.logger.log(`Publisher removed: ${key}`);
        }
    }

    /**
     * Finds the publisher data for a given app/stream combination.
     */
    getPublisher(app: string, streamName: string) {
        return this.publishers.get(`${app}/${streamName}`);
    }

    /**
     * Registers a session as a viewer (subscriber) of a stream.
     */
    addSubscriber(app: string, streamName: string, sessionId: string) {
        const key = `${app}/${streamName}`;
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key)?.add(sessionId);
        this.logger.log(`Subscriber added to ${key}: ${sessionId}`);
    }

    /**
     * Removes a viewer from the subscriber list.
     */
    removeSubscriber(app: string, streamName: string, sessionId: string) {
        const key = `${app}/${streamName}`;
        this.subscribers.get(key)?.delete(sessionId);
        this.logger.log(`Subscriber removed from ${key}: ${sessionId}`);
    }
}
