# E-Sight Codebase Context

## Project Overview

**E-Sight** (also referred to as E-Kaathi in UI documentation) is a React Native/Expo mobile application designed to provide assistive technology for visually impaired individuals and their caretakers. The app enables real-time location tracking, emergency SOS features, Bluetooth Low Energy (BLE) device connectivity, and bidirectional communication between blind users and their caretakers.

### Key Information
- **Platform**: React Native with Expo SDK 53
- **Framework**: Expo Router (file-based routing)
- **Package Manager**: npm
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Database**: SQLite with Drizzle ORM
- **Real-time Communication**: Socket.io
- **BLE Library**: react-native-ble-plx

---

## Project Architecture

### Application Structure

```
e-sight/
├── app/                          # Expo Router file-based routing
│   ├── (auth)/                   # Authentication flow
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── verify-email.tsx
│   │   ├── forgot-password.tsx
│   │   └── ...
│   └── (protected)/              # Protected routes
│       └── (tabs)/               # Bottom tab navigation
│           ├── index.tsx         # Home screen
│           ├── location.tsx      # Location tracking
│           ├── notifications/    # Notifications
│           └── profile/          # User profile
├── components/                   # Reusable UI components
│   ├── Home/                     # Home screen components
│   ├── Location/                 # Location components
│   ├── Notifications/            # Notification components
│   ├── Profile/                  # Profile components
│   └── ui/                       # Generic UI components
├── context/                      # React Context providers
│   ├── AuthContext.tsx           # Authentication state
│   ├── NotificationContext.tsx   # Notification management
│   └── SocketProvider.tsx        # WebSocket connection
├── db/                           # Database layer
│   ├── schema.ts                 # Drizzle schema definitions
│   ├── index.ts                  # Database instance
│   ├── controllers/              # Database operations
│   └── migration/                # Database migrations
├── hooks/                        # Custom React hooks
│   ├── useBLE.ts                 # Bluetooth functionality
│   ├── useEmergencyNotifications.ts
│   └── ...
├── store/                        # Zustand state stores
│   ├── deviceSlice.ts            # BLE device state
│   └── locationSlice.ts          # Location state
├── utils/                        # Utility functions
│   ├── LocationService.ts        # Background location tracking
│   ├── BackgroundBLEService.ts   # Background BLE monitoring
│   ├── sendSOSFeature.ts         # Emergency SOS functionality
│   ├── notificationHelpers.ts    # Notification utilities
│   └── axiosInstance.ts          # HTTP client configuration
├── schema/                       # Zod validation schemas
└── constants/                    # App-wide constants
```

---

## Core Features

### 1. User Roles & Authentication
The application supports two distinct user roles:
- **Blind Users**: Primary users who need location tracking and emergency assistance
- **Caretakers**: Support users who monitor and assist blind users

**Authentication Flow:**
- Email/phone + password authentication
- Email verification with OTP
- Password reset with verification codes
- Token-based authentication stored in SecureStore
- Persistent authentication state via AuthContext

**Key Files:**
- [context/AuthContext.tsx](context/AuthContext.tsx) - Authentication state management
- [app/(auth)/](app/(auth)/) - Auth screens (sign-in, sign-up, verify-email, etc.)
- [schema/](schema/) - Zod validation schemas for forms

### 2. Real-Time Location Tracking
Background location service that enables caretakers to monitor blind users in real-time.

**Features:**
- Background location tracking using Expo Location and Task Manager
- REST API for reliable location updates with retry logic
- Exponential backoff for failed requests
- Offline queue for location updates when network is unavailable
- Location persistence using SecureStore
- Foreground service notifications (Android)
- SQLite storage for location history
- Automatic batch processing of queued locations

**Key Files:**
- [utils/LocationService.ts](utils/LocationService.ts) - Core location tracking service with REST API integration
- [utils/locationAPI.ts](utils/locationAPI.ts) - Location API utility functions
- [store/locationSlice.ts](store/locationSlice.ts) - Location state management
- [components/Location/](components/Location/) - Location UI components
- [app/(protected)/(tabs)/location.tsx](app/(protected)/(tabs)/location.tsx) - Location screen

**Architecture:**
```
User Location → LocationService → REST API (with retry) → Backend
                      ↓                    ↓
                SQLite Database     Offline Queue
                      ↓                    ↓
                Notifications      Auto-retry when online
```

### 3. Bluetooth Low Energy (BLE) Device Management
Comprehensive BLE functionality for connecting to assistive devices.

**Features:**
- Device scanning and pairing
- Persistent device connections with background monitoring
- Connection health checks and auto-reconnect
- Characteristic reading/writing for data exchange
- Device history tracking in SQLite
- Background BLE service using Task Manager

**Key Files:**
- [hooks/useBLE.ts](hooks/useBLE.ts) - Primary BLE hook (696 lines)
- [utils/BackgroundBLEService.ts](utils/BackgroundBLEService.ts) - Background BLE monitoring
- [store/deviceSlice.ts](store/deviceSlice.ts) - BLE device state
- [components/Home/ConnectToDevice.tsx](components/Home/ConnectToDevice.tsx) - Device connection UI

**BLE Architecture:**
```
React Native BLE PLX Manager
        ↓
useBLE Hook → Device Scanning/Connection
        ↓
Background Service → Connection Monitoring
        ↓
SQLite (previousDevices table)
```

### 4. Emergency SOS System
Critical feature enabling blind users to send emergency alerts to their caretakers.

**Features:**
- One-tap SOS trigger
- Automatic location sharing
- SMS notifications to all connected caretakers
- Emergency notification logging
- Priority-based alert system

**Key Files:**
- [utils/sendSOSFeature.ts](utils/sendSOSFeature.ts) - SOS functionality
- [components/Notifications/EmergencyNotification.tsx](components/Notifications/EmergencyNotification.tsx)
- [hooks/useEmergencyNotifications.ts](hooks/useEmergencyNotifications.ts)

**SOS Flow:**
```
User Triggers SOS → Get Current Location → Send to Backend API
                                              ↓
                                    SMS to Caretakers
                                              ↓
                                    Local Notification
                                              ↓
                                    SQLite Storage
```

### 5. Notification System
Comprehensive notification management with local storage and categorization.

**Features:**
- Three notification types: Location, Emergency, Device
- SQLite persistence with Drizzle ORM
- Read/unread status tracking
- Priority levels (low, medium, high, critical)
- Notification history and filtering

**Key Files:**
- [utils/notificationHelpers.ts](utils/notificationHelpers.ts) - Core notification utilities
- [context/NotificationContext.tsx](context/NotificationContext.tsx) - Notification state
- [components/Notifications/](components/Notifications/) - Notification UI components
- [db/schema.ts](db/schema.ts) - Database schema

**Notification Schema:**
```typescript
notifications {
  id: string
  type: 'location' | 'emergency' | 'device'
  timestamp: timestamp
  isRead: boolean
  // Type-specific fields:
  latitude, longitude        // For location
  alertType, status, priority // For emergency
  deviceName, deviceId        // For device
}
```

### 6. Real-Time Communication
Socket.io-based real-time updates for room-based communication features.

**Features:**
- Persistent WebSocket connection
- Room-based communication (join/leave rooms)
- Automatic reconnection
- Connection state management

**Note:** Location updates have been migrated to REST API for improved reliability. Socket.io is now used primarily for real-time features like chat rooms and instant notifications.

**Key Files:**
- [context/SocketProvider.tsx](context/SocketProvider.tsx) - Socket.io provider for room management

---

## Database Schema (SQLite + Drizzle ORM)

### Tables

#### 1. `notifications`
Unified table for all notification types.

```typescript
- id: text (PK)
- type: 'location' | 'emergency' | 'device'
- timestamp: timestamp
- isRead: boolean
// Location fields
- latitude: real
- longitude: real
// Emergency fields
- alertType: 'sos' | 'panic' | 'medical' | 'fall_detection'
- status: 'active' | 'resolved' | 'acknowledged'
- priority: 'low' | 'medium' | 'high' | 'critical'
// Device fields
- deviceName: text
- deviceId: text
- deviceStatus: enum (connected, disconnected, etc.)
// Common
- details: text
- createdAt, updatedAt: timestamp
```

**Indexes:** type, timestamp, isRead, deviceId, (type, timestamp)

#### 2. `previousDevices`
BLE device connection history.

```typescript
- id: text (PK)
- deviceId: text (unique)
- deviceName: text
- lastConnected: timestamp
- connectionCount: integer
- isActive: boolean
- deviceInfo: json
- createdAt, updatedAt: timestamp
```

#### 3. `userSettings`
Application preferences and settings.

```typescript
- id: text (PK)
- key: text (unique)
- value: text
- type: 'string' | 'number' | 'boolean' | 'json'
- createdAt, updatedAt: timestamp
```

**Database Configuration:**
- [drizzle.config.ts](drizzle.config.ts) - Drizzle Kit configuration
- [db/schema.ts](db/schema.ts) - Schema definitions
- [db/index.ts](db/index.ts) - Database instance

---

## State Management

### Zustand Stores

#### Device Store ([store/deviceSlice.ts](store/deviceSlice.ts))
```typescript
interface DeviceSlice {
  connectedDevice: Device | null
  setConnectedDevice: (device: Device | null) => void
}
```

#### Location Store ([store/locationSlice.ts](store/locationSlice.ts))
```typescript
interface LocationState {
  latitude: number | null
  longitude: number | null
  updateLocation: (lat: number, lng: number) => void
}
```

### React Context

#### AuthContext
- Token management
- User authentication state
- User profile data
- Login/logout/register functions
- Connected users management

#### SocketProvider
- Socket.io connection management
- Room joining/leaving
- Location update emission
- Real-time event handling

#### NotificationContext
- Notification state management
- Notification CRUD operations
- Read status updates

---

## User Interface

### Design System
The app follows an **accessibility-first design** approach optimized for visually impaired users.

**Key Principles:**
- Maximum contrast (WCAG AAA - 7:1 ratio)
- Large font sizes (minimum 18px)
- Large touch targets (minimum 44px)
- High-contrast colors
- Screen reader support
- Clear visual hierarchy

**Styling:**
- NativeWind (Tailwind CSS)
- Custom color constants in [constants/Colors.ts](constants/Colors.ts)
- Responsive design with dimension-based calculations

### Component Architecture

#### Home Components
- **BlindHomeComponent.tsx**: Dashboard for blind users
  - QR code for caretaker connection
  - Location tracking controls
  - Emergency SOS button
  - Device connection status
  
- **CaretakerHomeComponent.tsx**: Dashboard for caretakers
  - List of connected blind users
  - Quick action buttons
  - Status indicators

#### Location Components
- **BlindLocationComponent.tsx**: Location sharing controls
- **CaretakerLocationComponent.tsx**: Map view with real-time tracking

#### Notification Components
- **NotificationsList.tsx**: Main notification feed
- **NotificationItem.tsx**: Individual notification card
- **EmergencyNotification.tsx**: Critical alert display
- **NotificationActions.tsx**: Action buttons (mark read, delete)

---

## Background Services

### 1. Location Service
- **Task Name**: `LOCATION_TASK_NAME`
- **Purpose**: Track location in background
- **Features**: 
  - Runs every 15 seconds (configurable)
  - Foreground service with notification
  - Socket.io integration
  - Location persistence

### 2. BLE Service
- **Task Names**: `ble-background-task`, `ble-connection-monitor-task`
- **Purpose**: Maintain BLE connections in background
- **Features**:
  - Connection health monitoring
  - Auto-reconnect on disconnect
  - Device state persistence
  - Battery optimization

---

## API Integration

### Axios Configuration
[utils/axiosInstance.ts](utils/axiosInstance.ts) - Configured HTTP client

**Base URL**: `process.env.EXPO_PUBLIC_REST_API_BASE_URL`

**Features:**
- Automatic token injection from SecureStore
- Request/response interceptors
- Error handling

### API Endpoints (Inferred)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Email verification
- `POST /messages/send-sos` - Emergency SOS
- `GET /health` - API health check
- `POST /location/update` - Update user location (REST API)
- `POST /location/batch-update` - Batch update multiple locations
- `GET /location/:userId` - Get current location for a user
- `GET /location/history/:userId` - Get location history

---

## Environment Configuration

### Build Variants
The app supports three build variants:
- **Development**: `com.sahilmane26.esight.dev`
- **Preview**: `com.sahilmane26.esight.preview`
- **Production**: `com.sahilmane26.esight`

**Configuration**: [app.config.ts](app.config.ts)

### Environment Variables
- `EXPO_PUBLIC_REST_API_BASE_URL` - Backend API URL
- `APP_VARIANT` - Build variant (development/preview/production)

### Platform-Specific Configuration

#### Android
- Target SDK: 35 (Android 15)
- Gradle: 8.9
- AGP: 8.7.2
- NDK: r28
- 16KB page size support
- Permissions: Location (always), Bluetooth, Camera, Notifications

#### iOS
- Bundle identifier varies by variant
- Location permissions (always and when in use)
- Bluetooth permissions
- Camera permissions

---

## Key Technologies & Libraries

### Core
- **expo**: `53.0.11` - Expo SDK
- **react**: `19.0.0` - React framework
- **react-native**: `0.79.3` - React Native
- **expo-router**: `~5.0.6` - File-based routing
- **typescript**: `~5.8.3` - Type safety

### State & Data
- **zustand**: `^5.0.6` - State management
- **drizzle-orm**: `^0.44.4` - Database ORM
- **expo-sqlite**: `~15.2.14` - SQLite database
- **zod**: `^3.25.42` - Schema validation
- **react-hook-form**: `^7.56.4` - Form management

### Backend Communication
- **axios**: `^1.9.0` - HTTP client
- **socket.io-client**: `^4.8.1` - WebSocket client

### Device Features
- **react-native-ble-plx**: `^3.5.0` - Bluetooth Low Energy
- **expo-location**: `~18.1.5` - Location services
- **expo-notifications**: `~0.31.3` - Push notifications
- **expo-camera**: `~16.1.7` - Camera access
- **expo-task-manager**: `~13.1.6` - Background tasks

### UI & Styling
- **nativewind**: `^4.1.23` - Tailwind CSS
- **tailwindcss**: `^3.4.17` - Styling framework
- **react-native-maps**: `^1.24.3` - Map integration
- **react-native-qrcode-svg**: `^6.3.15` - QR code generation
- **react-native-reanimated**: `3.17.5` - Animations

### Security
- **expo-secure-store**: `~14.2.3` - Secure key-value storage

---

## Security Considerations

### Data Storage
- **SecureStore**: Authentication tokens, sensitive user data
- **SQLite**: Notifications, device history, settings
- **AsyncStorage**: Non-sensitive app state

### Permissions
- Location (Always) - Required for background tracking
- Bluetooth - BLE device connectivity
- Camera - QR code scanning
- Notifications - Emergency alerts

### Authentication
- JWT-based token authentication
- Secure token storage
- Automatic token refresh (implementation inferred)

---

## Accessibility Features

### Screen Reader Support
- Comprehensive `accessibilityLabel` attributes
- `accessibilityHint` for complex interactions
- `accessibilityRole` for semantic elements
- `accessibilityViewIsModal` for dialogs

### Visual Accessibility
- WCAG AAA contrast ratios (7:1)
- Large font sizes (18px minimum)
- Large touch targets (44px minimum)
- High-contrast color scheme
- No reliance on color alone for information

### Navigation
- Logical tab order
- Clear focus indicators
- Consistent interaction patterns
- Descriptive labels

---

## Development Workflow

### Scripts
```json
{
  "start": "expo start",
  "dev": "APP_VARIANT=development npx expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web",
  "lint": "expo lint"
}
```

### Database Migrations
- Drizzle Kit for schema management
- Auto-migration on app launch via [utils/migrationRunner.ts](utils/migrationRunner.ts)
- Migration files in [db/migration/](db/migration/)

### Code Style
- ESLint with Expo configuration
- TypeScript strict mode
- Zod for runtime validation

---

## Recent Updates

### Location Service Migration to REST API (December 2025)
The location update mechanism has been migrated from Socket.io to REST API for improved reliability and resilience.

**Key Improvements:**
1. **Retry Logic**: Automatic retry with exponential backoff (up to 3 attempts)
2. **Offline Queue**: Failed updates are queued locally (max 100 items)
3. **Batch Processing**: Queued locations are sent in batches when connection restored
4. **Better Error Handling**: Comprehensive error tracking and recovery
5. **API Health Checks**: Pre-flight checks before starting location service
6. **Timeout Management**: 10-second timeout for location updates
7. **Reduced Dependencies**: Socket.io no longer required for location tracking

**Implementation Details:**
- Location updates use `POST /location/update` endpoint
- Failed requests stored in SecureStore with timestamps
- Automatic queue processing after successful updates
- Maximum queue size of 100 to prevent storage overflow
- Exponential backoff: 1s, 2s, 4s (max 10s between retries)

**Files Modified:**
- [utils/LocationService.ts](utils/LocationService.ts) - Core service refactored
- [utils/locationAPI.ts](utils/locationAPI.ts) - New API utility module
- [context/SocketProvider.tsx](context/SocketProvider.tsx) - Removed location functionality

### UI Redesign (See: [UI_REDESIGN_SUMMARY.md](UI_REDESIGN_SUMMARY.md))
A comprehensive accessibility-focused redesign was recently completed:

**Home Components:**
- Increased font sizes (text-4xl headers, text-xl body)
- Enhanced spacing (py-12, px-8)
- Modern card design (rounded-3xl, shadow-lg)
- Clear status indicators
- Emergency button prominence

**Improvements:**
- Maximum contrast color scheme
- Larger touch targets
- Screen reader optimization
- Consistent 8-unit spacing system
- Professional dashboard layouts

**Next Steps:**
- Profile component enhancement
- Authentication screen updates
- Device connection UI improvements
- Global styling standardization

---

## Known Issues & Considerations

### Current State
- Last terminal command: `npm audit fix` (Exit Code: 1) - Security vulnerabilities may exist
- Empty store.ts file - May need Zustand store configuration

### Platform-Specific
- **Android 16KB Page Size**: App configured for Android 15+ requirement (Nov 2025)
- **Background Services**: Different behavior on iOS vs Android
- **BLE Connections**: Connection stability varies by device/OS

### Future Enhancements
Based on UI_REDESIGN_SUMMARY.md:
1. Profile section redesign
2. Authentication flow improvements
3. Device connection interface enhancement
4. Design system standardization

---

## File Naming Conventions

### Routing
- `_layout.tsx` - Layout files for nested routes
- `(auth)` - Route groups (parentheses hide from URL)
- `+not-found.tsx` - 404 page

### Components
- PascalCase for components (e.g., `BlindHomeComponent.tsx`)
- camelCase for utilities (e.g., `axiosInstance.ts`)
- kebab-case for schemas (e.g., `sign-in-schema.ts`)

---

## Testing & Debugging

### Development Tools
- Expo Dev Client for testing
- React Native Debugger
- Flipper (for network/database inspection)

### Logging
- Extensive console.log statements throughout
- Error boundary implementation recommended
- Socket connection logging

---

## Contact & Support

**Bundle Identifiers:**
- Development: `com.sahilmane26.esight.dev`
- Preview: `com.sahilmane26.esight.preview`
- Production: `com.sahilmane26.esight`

**URL Scheme**: `esight://`

---

## Quick Reference

### Important Constants
Located in [utils/constants.ts](utils/constants.ts):
- `LAST_LOCATION_TOKEN` - SecureStore key for location
- `PREVIOUS_DEVICES` - SecureStore key for BLE devices
- `USER_AUTH_STATE` - SecureStore key for auth
- `LOCATION_TASK_NAME` - Background task name
- `SOSMESSAGE` - SOS message constant

### Color Scheme
Defined in [constants/Colors.ts](constants/Colors.ts):
- High contrast colors for accessibility
- Device connection state colors
- Emergency alert colors
- WCAG AAA compliant (7:1 ratio)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     E-Sight Mobile App                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   UI Layer   │  │  Navigation  │  │  Components  │    │
│  │ (NativeWind) │  │ (Expo Router)│  │   (React)    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │             │
│  ┌──────▼─────────────────▼──────────────────▼───────┐    │
│  │            State Management Layer                 │    │
│  │  ┌────────┐  ┌────────┐  ┌──────────────────┐    │    │
│  │  │Zustand │  │Context │  │  React Hook Form │    │    │
│  │  └────────┘  └────────┘  └──────────────────┘    │    │
│  └────────────────────┬──────────────────────────────┘    │
│                       │                                    │
│  ┌────────────────────▼──────────────────────────────┐    │
│  │              Business Logic Layer                 │    │
│  │  ┌────────┐  ┌──────┐  ┌──────┐  ┌───────────┐  │    │
│  │  │  BLE   │  │ Auth │  │ SOS  │  │ Location  │  │    │
│  │  │ Hooks  │  │      │  │      │  │  Service  │  │    │
│  │  └────────┘  └──────┘  └──────┘  └───────────┘  │    │
│  └────────────────────┬──────────────────────────────┘    │
│                       │                                    │
│  ┌────────────────────▼──────────────────────────────┐    │
│  │               Data Layer                          │    │
│  │  ┌──────────┐  ┌────────┐  ┌──────────────────┐  │    │
│  │  │  SQLite  │  │ Secure │  │  Socket.io       │  │    │
│  │  │ (Drizzle)│  │  Store │  │  Connection      │  │    │
│  │  └──────────┘  └────────┘  └──────────────────┘  │    │
│  └────────────────────┬──────────────────────────────┘    │
│                       │                                    │
│  ┌────────────────────▼──────────────────────────────┐    │
│  │          Native Device Features                   │    │
│  │  ┌──────┐  ┌────────┐  ┌──────┐  ┌────────────┐  │    │
│  │  │  BLE │  │Location│  │Camera│  │Notifications│  │    │
│  │  └──────┘  └────────┘  └──────┘  └────────────┘  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │   Backend Services    │
               │  - REST API (axios)   │
               │  - WebSocket (socket) │
               │  - SMS Gateway        │
               └───────────────────────┘
```

---

## Summary

E-Sight is a sophisticated assistive technology application that bridges the gap between visually impaired users and their caretakers through real-time location tracking, emergency response systems, and device connectivity. The codebase demonstrates:

- **Robust architecture** with clear separation of concerns
- **Accessibility-first design** meeting WCAG AAA standards
- **Complex state management** across multiple layers
- **Native feature integration** (BLE, Location, Notifications)
- **Real-time communication** via WebSocket
- **Persistent data storage** with SQLite and SecureStore
- **Background service management** for critical features

The recent UI redesign has significantly improved the user experience for visually impaired users, with further enhancements planned for authentication, profile, and device connection interfaces.

---

*Generated: December 27, 2025*
*Version: 1.0.0*
