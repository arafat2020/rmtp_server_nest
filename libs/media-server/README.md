# media-server 🌐

This library provides a small RTMP (Real Time Messaging Protocol) server implemented as a NestJS service. It is designed to be embedded in the `media-server-app` and provides the TCP listener that accepts RTMP clients (OBS, ffmpeg, VLC, etc.).

---

## Quick overview ✅

- RTMP server listens on port **1935** (hard-coded in the current implementation).
- An HTTP app is provided by `apps/media-server-app` and listens on `PORT` (default: **8000**).
- Current features:
  - RTMP handshake is implemented (server accepts clients that speak RTMP v3).
  - Session lifecycle (connect/disconnect) logging is available.
- Known limitations:
  - Full RTMP chunk parsing and media routing is a TODO (see `libs/media-server/src/lib/rtmp.session.ts`).

---

## Quick start — run the server 🚀

1. Build and serve the media server app using Nx:

```bash
# From repository root
nx run media-server-app:serve
```

2. You should see logs like:

```
🚀 Media Server (HTTP/API) is running on: http://localhost:8000
🚀 RTMP Server is running on: rtmp://localhost:1935
```

> Tip: Change the HTTP port by setting `PORT` before starting the app (e.g., `PORT=5555 nx run media-server-app:serve`). RTMP port is currently fixed at `1935` in code.

---

## How to publish a stream (examples) 🎥

- OBS
  - Service / URL: `rtmp://localhost:1935/live`
  - Stream key: any name (e.g., `test`) — OBS will attempt an RTMP handshake and then publish the stream.

- ffmpeg (CLI example)

```bash
ffmpeg -re -i sample.mp4 -c copy -f flv rtmp://localhost:1935/live/test
```

Watch the server logs — a successful handshake will show a message like:

```
Handshake complete for session <session-id>
```

Note: Because chunk parsing is not implemented yet, media frames may not be processed fully. The server will accept connections and complete the RTMP handshake.

---

## Checking behavior & troubleshooting ⚠️

- If a client fails to connect, check logs for:
  - `Unsupported RTMP version`: The client is using a version other than RTMP v3.
  - `Socket error` messages: network or client-side problems.
- Common issues:
  - Port 1935 already in use — stop the conflicting process or update the code to use a different port.
  - Firewall settings preventing TCP connections on 1935.

---

## Development notes & contribution 💡

- Source files of interest:
  - `libs/media-server/src/lib/rtmp.service.ts` — TCP server lifecycle and port configuration.
  - `libs/media-server/src/lib/rtmp.session.ts` — RTMP handshake implementation and TODO for chunk parsing.
  - `libs/media-server/src/lib/stream-manager.service.ts` — publisher/subscriber registry & events.

- To implement full stream ingestion:
  1. Implement `processChunks` in `RtmpSession` to parse chunk headers, reassemble messages, and route audio/video messages to subscribers.
  2. Integrate media demux/mux or forward raw FLV frames to downstream services as needed.

- Tests: add unit tests for handshake and socket lifecycle; consider an integration test that uses `ffmpeg` to push sample input and asserts expected events.

---

## Questions or help? 🤝

If you want, I can:
- Add an example integration test using `ffmpeg` and `ffplay`.
- Add environment-configurable RTMP port and graceful shutdown improvements.

Contributions welcome — open a PR with your changes and reference this README.
