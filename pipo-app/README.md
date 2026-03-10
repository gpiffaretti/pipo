# Pipo

A WhatsApp-like mobile app for storing and sharing valuable memories of your children with trusted family members.

## Tech Stack

- **Framework**: React Native (Expo SDK 55) + TypeScript (strict mode)
- **Navigation**: React Navigation (native stack)
- **Local Database**: SQLite (expo-sqlite)
- **Media**: expo-image-picker, expo-av, expo-image-manipulator
- **Connectivity**: @react-native-community/netinfo
- **Testing**: Jest + React Native Testing Library

## Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)
- For iOS: macOS with Xcode installed
- For Android: Android Studio with an emulator configured

## Getting Started

```bash
# Install dependencies
cd pipo-app
npm install

# Start the Expo development server
npm start

# Run on specific platform
npm run ios      # iOS simulator (macOS only)
npm run android  # Android emulator
npm run web      # Web browser
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in web browser |
| `npm test` | Run Jest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run typecheck` | TypeScript type checking |

## Project Structure

```
pipo-app/
├── App.tsx                    # App entry point, service initialization
├── src/
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   ├── navigation/            # React Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/               # Screen components
│   │   ├── ChatListScreen.tsx
│   │   └── ChatScreen.tsx
│   ├── components/            # Reusable UI components
│   │   ├── ChatListItem.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── ConnectivityBanner.tsx
│   │   └── UploadProgressBar.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useDatabase.ts
│   │   ├── useConnectivity.ts
│   │   └── useMediaCapture.ts
│   ├── db/                    # SQLite database layer
│   │   ├── database.ts
│   │   └── queries.ts
│   ├── services/              # Business logic services
│   │   ├── connectivityService.ts
│   │   ├── messageQueue.ts
│   │   └── mediaService.ts
│   ├── data/                  # Mock data
│   │   └── mockData.ts
│   └── utils/                 # Utility functions
│       └── formatters.ts
├── __tests__/                 # Test files
│   ├── App.test.tsx
│   ├── components/
│   │   └── MessageBubble.test.tsx
│   └── utils/
│       └── formatters.test.ts
├── jest.config.js
├── jest.setup.js
├── .eslintrc.js
├── .prettierrc
└── tsconfig.json
```

## Architecture Overview

### Phase 0 — Project Foundation
- Expo + TypeScript with strict mode
- ESLint + Prettier for code quality
- Jest for testing
- React Navigation for screen management

### Phase 1 — Chat UI
- WhatsApp-like chat list with last message preview
- Message bubbles supporting text, photo, video, and audio
- Message input with attachment options and voice recording button
- New chat creation via FAB + modal

### Phase 2 — Offline-First Persistence
- Local SQLite database for chats, messages, and media metadata
- Message send queue with automatic retry on connectivity restoration
- Optimistic UI: messages appear immediately with pending/sent/failed status
- Connectivity banner shows offline state

### Phase 3 — Media Capture & Processing
- Photo capture (camera) and gallery selection
- Video capture and gallery selection
- Audio voice note recording (expo-av)
- Original full-quality media saved locally
- Compressed copies generated for local playback (images resized to 800px width, 70% quality)
- Media upload queue with progress tracking (simulated — no backend yet)
- Media previews in message bubbles

## Notes

- **No backend yet** — message sending and media uploads are simulated locally. Backend integration starts at Phase 4.
- **Mock data** is seeded on first launch with sample chats and messages.
- **Current user ID** is hardcoded as `user-1` (auth comes in Phase 6).
