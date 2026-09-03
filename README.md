# Voice Diary

A warm, tactile voice journaling web app. Speak your thoughts, watch your words appear in
real time, and let AI turn each entry into meaningful reflections — mood, topics, a title,
people mentioned, action items, and key ideas. Everything stays in your browser.

## What it does

- **Voice-first capture** — tap the recording orb and speak; no typing required.
- **Real-time transcription** — live captions stream in as you talk (Speechmatics).
- **AI insights** — each entry is analyzed for mood, topics, title, people, action items, and key ideas (Gemini).
- **Daily journaling prompts** — a rotating, date-seeded "prompt of the day" with tap-to-shuffle.
- **Search & browse** — filter past entries by title, transcript, topics, or mood.
- **Reflection stats** — daily streak, total entry count, and mood distribution.
- **Private by design** — no accounts, no servers storing your data; entries live in `localStorage`.

## Tech stack

- **React 18 + TypeScript** with **Vite**
- **Tailwind CSS v4** for styling
- **Framer Motion** for micro-interactions and animations
- **Supabase Edge Functions** for backend logic (Speechmatics token minting, Gemini analysis)
- **Fonts** — Inter (UI) and Instrument Serif (journal titles)

## Getting started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# production build
npm run build

# preview the production build
npm run preview
```

## Project structure

```
src/
  components/          # UI components
    Greeting.tsx       # time-of-day greeting
    RecordingOrb.tsx   # the central record button + mic handling
    AudioVisualizer.tsx
    LiveTranscription.tsx
    AnalysisOverlay.tsx
    JournalingPrompt.tsx
    SearchBar.tsx
    ReflectionStats.tsx
    JournalFeed.tsx
    EntryCard.tsx
    EntryDetail.tsx
  hooks/               # custom hooks (e.g. useEntries)
  lib/                 # entries, moods, Supabase client
  types.ts             # shared TypeScript types
  App.tsx
  main.tsx
```

## Integrations

### Speechmatics (speech-to-text)

Real-time streaming transcription. The browser opens a WebSocket directly to Speechmatics
using a short-lived JWT minted by the `speechmatics-token` Edge Function. The API key is
stored as a **Supabase Edge Function secret** and is never exposed to the client.

### Google Gemini (AI analysis)

After recording, the transcript is sent to the `analyze-entry` Edge Function, which calls the
Gemini API and returns structured analysis. The `GEMINI_API_KEY` is stored as a **Supabase
Edge Function secret** — the browser only ever talks to the Edge Function.

### Supabase

Used for hosting Edge Functions only. No database tables and no auth are required — all
journal data is persisted locally in `localStorage`.

## Environment & secrets

Secrets are managed in the Supabase Secret Manager and read inside Edge Functions via
`Deno.env.get(...)`. They are never placed in `.env` files or client code:

- `SPEECHMATICS_API_KEY`
- `GEMINI_API_KEY`
