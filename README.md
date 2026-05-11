# Flips

Flips is an AI-native video editing studio built on the Runway API.
Submitted to the Runway API Hackathon, May 2026.

## What it does

Flips replaces the traditional video editing paradigm with an intent-driven
interface. Instead of manually trimming clips and applying effects through
nested menus, users describe what they want in plain language and the system
executes it — generating footage, transforming existing clips, adding sound,
isolating voices, and assembling narratives automatically.

The core editing interface consists of a WebGL preview canvas, a timeline with
named markers, and a floating command input. Runway's full model surface is
exposed through this interface: Gen-4.5 for text and image-to-video generation,
Aleph for video-to-video transformation, ElevenLabs models for sound effects
and voice isolation, and Whisper for subtitle generation.

Muse, a multi-clip auto-assembly mode, accepts raw footage and a narrative
description and produces a complete edit — ordering clips, applying transforms,
and generating connective audio — using an LLM orchestration layer over
batched Runway API calls.

## Architecture

- Frontend: Nuxt 4, Pinia, Tailwind, WebGL (video texture rendering)
- Storage: IndexedDB via Dexie for media blobs, localStorage for timeline state
- Backend: Modal (serverless Python) + FastAPI
- AI: Runway Gen-4.5, Aleph, ElevenLabs sound/isolation, Whisper
- Job tracking: Modal KV store, scoped per machine token

## Backend

All Runway API calls are proxied through a Modal-hosted FastAPI server.
Each request requires a Machine-Token header — a UUID generated on first
visit and persisted in localStorage — which scopes all jobs to the originating
machine. Job state is stored in Modal's KV store under `{token}:{taskId}` keys.

POST /runway/generate     text or image to video via Gen-4.5
POST /runway/transform    video to video via Aleph
POST /runway/sound        text to sound effect via ElevenLabs
POST /runway/isolate      voice isolation
GET  /runway/job/:id      poll task status
GET  /runway/jobs         list all jobs for this machine
POST /transcribe          audio to timestamped subtitles via Whisper
POST /export              FFmpeg clip stitching to final MP4

## Running locally

```bash
# frontend
npm install
npm run dev

# backend
cd api
modal deploy main.py
```

Set `MODAL_BASE_URL` in `.env` to your deployed Modal endpoint.
Set `FLIPS_RUNWAYML_API_KEY` as a Modal secret named `flips-secrets`.

## Credits

Built by Marvellous (0x_aut) for the Runway API Hackathon 2026.