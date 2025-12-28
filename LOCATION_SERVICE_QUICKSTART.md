# 🚀 Quick Start: Location Service REST API

## 📋 What You Need to Know

The location service now uses **REST API** instead of Socket.io for better reliability.

---

## ⚡ Quick Start

### Starting Location Tracking
```typescript
import LocationService from '@/utils/LocationService';

const locationService = new LocationService();
const success = await locationService.startBackgroundService();
```

### Stopping Location Tracking
```typescript
await locationService.stopBackgroundService();
```

### Checking Status
```typescript
const isActive = await locationService.isServiceActive();
const isConnected = await locationService.getConnectionStatus();
```

---

## 🔧 Key Features

| Feature | Description |
|---------|-------------|
| **Auto Retry** | Failed updates retry 3 times with exponential backoff |
| **Offline Queue** | Stores up to 100 failed updates locally |
| **Batch Processing** | Sends 10 queued locations at a time |
| **Health Checks** | Verifies API before starting service |
| **Error Recovery** | Automatic recovery when connection restored |

---

## 📡 API Endpoints

### Your Backend Must Have:

```http
POST /location/update
{
  "userId": "string",
  "location": {
    "latitude": number,
    "longitude": number,
    "accuracy": number | null,
    "altitude": number | null,
    "speed": number | null,
    "timestamp": number
  }
}
```

### Optional but Recommended:
- `GET /health` - Health check
- `POST /location/batch-update` - Batch processing
- `GET /location/:userId` - Get location

---

## 🛠️ Using Location API Utilities

```typescript
import { updateLocation, getLocationByUserId } from '@/utils/locationAPI';

// Update location
const result = await updateLocation({
  userId: 'user123',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10,
    altitude: null,
    speed: null,
    timestamp: Date.now()
  }
});

// Get location
const data = await getLocationByUserId('user123');
```

---

## 🔍 Monitoring

### Check Offline Queue
```typescript
import * as SecureStore from 'expo-secure-store';

const queue = await SecureStore.getItemAsync('locationOfflineQueue');
const count = queue ? JSON.parse(queue).length : 0;
console.log(`Queued locations: ${count}`);
```

### Check Last Update
```typescript
const last = await SecureStore.getItemAsync('LAST_LOCATION_TOKEN');
console.log('Last update:', JSON.parse(last));
```

---

## ⚙️ Configuration

Located in `utils/LocationService.ts`:

```typescript
// Retry settings
maxRetries: 3
retryDelay: 1000ms (initial)
maxBackoff: 10000ms

// Queue settings
MAX_QUEUE_SIZE: 100
BATCH_SIZE: 10

// Timeouts
updateTimeout: 10000ms
healthTimeout: 5000ms
```

---

## 🐛 Troubleshooting

### Location updates not working?
1. Check API health: `await locationService.checkAPIHealth()`
2. Verify permissions granted
3. Check network connection
4. Review console logs

### Queue filling up?
1. Check backend API status
2. Verify network connectivity
3. Check authentication token

### Service won't start?
1. Grant location permissions
2. Grant notification permissions
3. Verify API base URL configured
4. Check console for errors

---

## 📚 Documentation

- **Full Guide**: [LOCATION_SERVICE_MIGRATION.md](LOCATION_SERVICE_MIGRATION.md)
- **Summary**: [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
- **Context**: [CODEBASE_CONTEXT.md](CODEBASE_CONTEXT.md)

---

## 🔄 Migration Changes

### ❌ Removed
- `sendLocationUpdates()` from SocketProvider
- Socket.io dependency from LocationService

### ✅ Added
- REST API with retry logic
- Offline queue system
- Batch processing
- Health checks
- Better error handling

---

## 💡 Best Practices

1. **Always check API health before starting service**
2. **Monitor queue size periodically**
3. **Handle errors gracefully in UI**
4. **Test offline scenarios**
5. **Set up backend monitoring**

---

## 🎯 Common Use Cases

### Start tracking when user logs in
```typescript
const { authState } = useAuth();

useEffect(() => {
  if (authState?.authenticated && userDetails?.role === 'blind') {
    locationService.startBackgroundService();
  }
}, [authState]);
```

### Stop tracking on logout
```typescript
const handleLogout = async () => {
  await locationService.stopBackgroundService();
  await logout();
};
```

### Show connection status
```typescript
const [isConnected, setIsConnected] = useState(false);

useEffect(() => {
  const checkStatus = async () => {
    const connected = await locationService.getConnectionStatus();
    setIsConnected(connected);
  };
  checkStatus();
}, []);
```

---

**Version**: 2.0.0  
**Updated**: December 27, 2025  
**Status**: ✅ Production Ready
