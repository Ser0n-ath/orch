# Orchestra Mobile

A frontend-only Expo/React Native mobile app that provides an intuitive interface for interacting with Orchestra backend services through text commands. Voice functionality is planned for future implementation.

## Features

- 💬 **Text Input**: Type queries manually with multi-line text input
- 📱 **Cross-platform**: Runs on iOS, Android, and web via Expo
- 📚 **History**: Persistent query history with AsyncStorage  
- 🏗️ **Clean Architecture**: Scalable structure with TypeScript
- 🎨 **Modern UI**: Built with React Native StyleSheet
- 🔄 **Job Tracking**: Real-time job status monitoring (planned)

## Tech Stack

- **Expo ~52.0.0** with React Native 0.76.9 and TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Zustand with AsyncStorage persistence
- **Networking**: Axios for REST API, Socket.IO client (prepared for future WebSocket)
- **Styling**: React Native StyleSheet
- **Voice**: Expo Speech (implementation in progress)
- **Testing**: Jest + React Native Testing Library

## Project Structure

```
orch-app/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── navigation/
│   │   └── index.tsx          # Navigation configuration
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Text input and query submission
│   │   ├── ResultScreen.tsx   # Query results and job status  
│   │   ├── HistoryScreen.tsx  # Query history
│   │   └── SettingsScreen.tsx # App settings
│   ├── components/
│   │   └── VoiceButton.tsx    # Voice input placeholder (not implemented)
│   ├── store/
│   │   └── useAppStore.ts     # Zustand state management with persistence
│   ├── services/
│   │   ├── api.ts             # REST API client
│   │   └── socket.ts          # WebSocket client (prepared for future use)
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/
│   │   └── formatters.ts      # Utility functions
│   └── __tests__/
│       ├── setup.ts           # Test configuration
│       └── store/
│           └── useAppStore.test.ts # Store tests
├── app.json                    # Expo configuration
├── package.json
└── tsconfig.json
```

## Setup & Installation

### Prerequisites

- Node.js >= 16
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)
- Expo Go app on your mobile device (for testing)
- For native builds: EAS CLI (`npm install -g @expo/eas-cli`)

### Installation

1. **Install dependencies**:
   ```bash
   cd orch-app
   npm install
   ```

2. **Environment Configuration**:
   Update API endpoints in `src/services/api.ts` and `src/services/socket.ts`:
   ```javascript
   const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-production-api.com';
   const WEBSOCKET_URL = __DEV__ ? 'ws://localhost:3000' : 'wss://your-production-api.com';
   ```

3. **Run the app**:
   ```bash
   # Development server
   npm start
   
   # iOS simulator
   npm run ios
   
   # Android emulator  
   npm run android
   
   # Web browser
   npm run web
   ```

## Backend Integration

⚠️ **Current Status**: The mobile app is configured to integrate with Orchestra backend services, but there is a **mismatch between the expected API endpoints and the actual server implementation**.

### Expected API Endpoints (Mobile App)

The mobile app currently tries to call:

- **POST** `/api/execute-query` *(Not implemented on server)*
  ```json
  {
    "query": "Where is my Amazon order?",
    "mode": "voice" | "text"  
  }
  ```

- **GET** `/api/jobs/:jobId/status` *(Not implemented on server)*
- **GET** `/api/health` *(Available as `/api/v1/health`)*

### Actual Server Endpoints (orch-server)

The server currently provides:

- **POST** `/api/v1/execute-plan` - Execute browser automation plan
- **GET** `/api/v1/health` - Health check
- **POST** `/api/v1/reset-browser` - Reset browser instance

### WebSocket Integration

The mobile app includes Socket.IO client setup for real-time updates, but the server does not currently implement WebSocket functionality. This is prepared for future implementation.

### Required Integration Work

To connect the mobile app with the current server:

1. **Server**: Add `/api/execute-query` endpoint that accepts natural language queries
2. **Server**: Add job tracking and status endpoints  
3. **Server**: Implement WebSocket support for real-time progress updates
4. **Mobile**: Update API calls to match current server endpoints (temporary solution)

## Configuration

### Environment Variables

Update these in your app configuration:

```javascript
// src/services/api.ts
const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-production-api.com';

// src/services/socket.ts  
const WEBSOCKET_URL = __DEV__ ? 'ws://localhost:3000' : 'wss://your-production-api.com';
```

### Voice Recognition

The app supports voice input on both platforms:
- **iOS**: Uses built-in Speech Framework
- **Android**: Requires microphone permissions

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## App Screens

### 1. Home Screen
- Multi-line text input field for query submission
- Voice input button (placeholder - not yet functional)
- Quick action examples for user guidance
- Submit button to send queries to backend
- Loading states during query processing

### 2. Result Screen  
- Job status display for submitted queries
- Navigation back to home screen
- Placeholder for real-time progress updates (WebSocket integration pending)
- Error handling for failed requests

### 3. History Screen
- Persistent query history using AsyncStorage
- Status indicators (in-progress, completed, error)
- Query details and timestamps
- Clear history functionality

### 4. Settings Screen
- App version and build information
- Contact information and support links
- Clear data options
- About Orchestra platform information

## Permissions

### iOS
- **Network**: HTTP/HTTPS requests (automatic with Expo)
- **Microphone**: Will be required when voice input is implemented

### Android
- **INTERNET**: Network requests (automatic with Expo)
- **RECORD_AUDIO**: Will be required when voice input is implemented

## Troubleshooting

### Common Issues

1. **Expo bundler issues**: Clear cache with `npx expo start -c`
2. **Node modules issues**: Delete `node_modules` and run `npm install`
3. **Build errors**: Clear Expo cache with `npx expo install --fix`
4. **Network connectivity**: Ensure device and development machine are on the same network
5. **API connection failed**: Verify server is running and accessible at configured URL

### Debug Mode

Enable debug logging in development mode (`__DEV__` flag). Console logs show:
- API requests/responses with full details
- Navigation state changes
- AsyncStorage operations
- Error stack traces

## Contributing

1. Follow TypeScript strict mode guidelines
2. Use React Native StyleSheet for component styling
3. Add tests for new features in `src/__tests__/`
4. Update this README for new functionality
5. Test on both iOS and Android platforms via Expo

## License

This project is part of the Orchestra automation platform.