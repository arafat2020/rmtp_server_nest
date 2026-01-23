/**
 * AMF0 (Action Message Format) Types.
 * These are the markers used in the binary format to identify data types.
 */
export enum AMF0_TYPE {
    NUMBER = 0x00,
    BOOLEAN = 0x01,
    STRING = 0x02,
    OBJECT = 0x03,
    MOVIECLIP = 0x04,
    NULL = 0x05,
    UNDEFINED = 0x06,
    REFERENCE = 0x07,
    ECMA_ARRAY = 0x08,
    OBJECT_END = 0x09,
    STRICT_ARRAY = 0x0a,
    DATE = 0x0b,
    LONG_STRING = 0x0c,
    UNSUPPORTED = 0x0d,
    RECORDSET = 0x0e,
    XML_DOCUMENT = 0x0f,
    TYPED_OBJECT = 0x10,
}

/**
 * AMF0 Codec implementation.
 * AMF0 is used by RTMP to send data and commands (like 'connect' or metadata) 
 * in a format that both Flash and the server understand.
 */
export class AMF0 {
    /**
     * Encodes a list of JavaScript variables into a single AMF0 binary buffer.
     * @param data Array of items to encode (strings, numbers, objects, etc.)
     */
    static encode(data: any[]): Buffer {
        const buffers: Buffer[] = [];
        for (const item of data) {
            buffers.push(this.encodeItem(item));
        }
        return Buffer.concat(buffers);
    }

    /**
     * Internal helper to encode a single item based on its type.
     */
    private static encodeItem(item: any): Buffer {
        if (typeof item === 'number') {
            const buf = Buffer.alloc(9);
            buf.writeUInt8(AMF0_TYPE.NUMBER, 0);
            buf.writeDoubleBE(item, 1);
            return buf;
        } else if (typeof item === 'boolean') {
            const buf = Buffer.alloc(2);
            buf.writeUInt8(AMF0_TYPE.BOOLEAN, 0);
            buf.writeUInt8(item ? 1 : 0, 1);
            return buf;
        } else if (typeof item === 'string') {
            const len = Buffer.byteLength(item);
            const buf = Buffer.alloc(3 + len);
            buf.writeUInt8(AMF0_TYPE.STRING, 0);
            buf.writeUInt16BE(len, 1);
            buf.write(item, 3);
            return buf;
        } else if (item === null) {
            const buf = Buffer.alloc(1);
            buf.writeUInt8(AMF0_TYPE.NULL, 0);
            return buf;
        } else if (typeof item === 'object') {
            if (Array.isArray(item)) {
                // ECMA Array (Key-Value array with extra properties)
                const buffers: Buffer[] = [];
                buffers.push(Buffer.from([AMF0_TYPE.ECMA_ARRAY, 0, 0, 0, 0]));
                for (const key in item) {
                    buffers.push(this.encodeString(key));
                    buffers.push(this.encodeItem(item[key]));
                }
                /** Every object/array in AMF0 must end with a specific marker */
                buffers.push(Buffer.from([0, 0, AMF0_TYPE.OBJECT_END]));
                return Buffer.concat(buffers);
            } else {
                // Standard JavaScript Object
                const buffers: Buffer[] = [];
                buffers.push(Buffer.from([AMF0_TYPE.OBJECT]));
                for (const key in item) {
                    buffers.push(this.encodeString(key));
                    buffers.push(this.encodeItem(item[key]));
                }
                buffers.push(Buffer.from([0, 0, AMF0_TYPE.OBJECT_END]));
                return Buffer.concat(buffers);
            }
        }
        return Buffer.alloc(0);
    }

    /**
     * Encodes a string (used for object keys) without the AMF0 type marker.
     */
    private static encodeString(str: string): Buffer {
        const len = Buffer.byteLength(str);
        const buf = Buffer.alloc(2 + len);
        buf.writeUInt16BE(len, 0);
        buf.write(str, 2);
        return buf;
    }

    /**
     * Decodes an AMF0 binary buffer into an array of JavaScript items.
     */
    static decode(buffer: Buffer): any[] {
        const results: any[] = [];
        let offset = 0;
        while (offset < buffer.length) {
            const decoded = this.decodeItem(buffer, offset);
            results.push(decoded.value);
            offset = decoded.offset;
        }
        return results;
    }

    /**
     * Decodes a single item from the buffer at the specified offset.
     */
    static decodeItem(buffer: Buffer, offset: number): { value: any; offset: number } {
        const type = buffer.readUInt8(offset);
        offset += 1;

        switch (type) {
            case AMF0_TYPE.NUMBER:
                return { value: buffer.readDoubleBE(offset), offset: offset + 8 };
            case AMF0_TYPE.BOOLEAN:
                return { value: buffer.readUInt8(offset) !== 0, offset: offset + 1 };
            case AMF0_TYPE.STRING: {
                const len = buffer.readUInt16BE(offset);
                offset += 2;
                const str = buffer.toString('utf8', offset, offset + len);
                return { value: str, offset: offset + len };
            }
            case AMF0_TYPE.OBJECT: {
                const obj: any = {};
                while (true) {
                    const keyLen = buffer.readUInt16BE(offset);
                    offset += 2;
                    if (keyLen === 0) {
                        if (buffer.readUInt8(offset) === AMF0_TYPE.OBJECT_END) {
                            offset += 1;
                            break;
                        }
                    }
                    const key = buffer.toString('utf8', offset, offset + keyLen);
                    offset += keyLen;
                    const decoded = this.decodeItem(buffer, offset);
                    obj[key] = decoded.value;
                    offset = decoded.offset;
                }
                return { value: obj, offset };
            }
            case AMF0_TYPE.ECMA_ARRAY: {
                // Skip length (4 bytes)
                offset += 4;
                const obj: any = {};
                while (true) {
                    const keyLen = buffer.readUInt16BE(offset);
                    offset += 2;
                    if (keyLen === 0) {
                        if (buffer.readUInt8(offset) === AMF0_TYPE.OBJECT_END) {
                            offset += 1;
                            break;
                        }
                    }
                    const key = buffer.toString('utf8', offset, offset + keyLen);
                    offset += keyLen;
                    const decoded = this.decodeItem(buffer, offset);
                    obj[key] = decoded.value;
                    offset = decoded.offset;
                }
                return { value: obj, offset };
            }
            case AMF0_TYPE.NULL:
                return { value: null, offset };
            case AMF0_TYPE.UNDEFINED:
                return { value: undefined, offset };
            default:
                console.warn('Unknown AMF0 type:', type);
                return { value: null, offset };
        }
    }
}
