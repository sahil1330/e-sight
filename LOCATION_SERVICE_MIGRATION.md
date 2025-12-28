# Location Service Migration Guide

## Overview
The location tracking service has been migrated from Socket.io to REST API for improved reliability, better error handling, and enhanced offline support.

## What Changed

### Before (Socket.io)
```typescript
// Location updates sent via WebSocket
socket.emit("locationUpdate", locationData);
```

**Issues:**
- Connection drops could lose location updates
- No automatic retry mechanism
- Difficult to track failed updates
- Real-time dependency even when not needed

### After (REST API)
```typescript
// Location updates sent via HTTP with retry logic
await sendLocationUpdate(locationData);
```

**Benefits:**
✅ Automatic retry with exponential backoff  
✅ Offline queue for failed updates  
✅ Batch processing when connection restored  
✅ Better error tracking and recovery  
✅ Independent of WebSocket connection  
✅ More reliable for background tasks  

## Key Features

### 1. Retry Logic
Failed location updates are automatically retried up to 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- After max retries: Added to offline queue

### 2. Offline Queue
When all retries fail, location updates are stored locally:
- Maximum queue size: 100 locations
- Stored in SecureStore with timestamps
- Automatically processed when connection restored
- FIFO (First In, First Out) processing

### 3. Batch Processing
Queued locations are sent in batches:
- Batch size: 10 locations per cycle
- Prevents API overwhelming
- Successful updates removed from queue
- Failed updates remain for next cycle

### 4. Health Checks
API health is verified before starting the service:
```typescript
const isHealthy = await locationService.checkAPIHealth();
```

## API Endpoints

### Location Update
```http
POST /location/update
Content-Type: application/json

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

### Batch Update
```http
POST /location/batch-update
Content-Type: application/json

{
  "locations": [
    {
      "userId": "string",
      "location": { ... }
    },
    ...
  ]
}
```

### Get Location
```http
GET /location/:userId
```

### Get Location History
```http
GET /location/history/:userId?limit=50
```

## Usage Examples

### Starting Location Service
```typescript
import LocationService from '@/utils/LocationService';

const locationService = new LocationService();

// Start tracking
const success = await locationService.startBackgroundService();
if (success) {
  console.log('Location tracking started');
}
```

### Checking Service Status
```typescript
// Check if service is running
const isActive = await locationService.isServiceActive();

// Check API connection
const isConnected = await locationService.getConnectionStatus();
```

### Using Location API Utilities
```typescript
import { 
  updateLocation, 
  getLocationByUserId,
  batchUpdateLocations 
} from '@/utils/locationAPI';

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

// Get user location
const locationData = await getLocationByUserId('user123');
```

## Error Handling

### Network Errors
```typescript
// Automatically handled with retry logic
// If all retries fail, location is queued
// Queue is processed when connection restored
```

### Authentication Errors
```typescript
// User auth is checked before each update
// If auth fails, error is logged and task returns
```

### Storage Errors
```typescript
// SecureStore operations are wrapped in try-catch
// Errors are logged but don't stop the service
```

## Configuration

### Retry Settings
Located in `LocationService` class:
```typescript
this.maxRetries = 3;
this.retryDelay = 1000; // 1 second initial delay
```

### Queue Settings
```typescript
const MAX_QUEUE_SIZE = 100; // Maximum queued locations
const BATCH_SIZE = 10;      // Locations per batch
```

### Timeout Settings
```typescript
// Location update timeout
timeout: 10000  // 10 seconds

// Health check timeout
timeout: 5000   // 5 seconds
```

## Monitoring

### Check Queue Size
```typescript
import * as SecureStore from 'expo-secure-store';

const queueStr = await SecureStore.getItemAsync('locationOfflineQueue');
const queue = queueStr ? JSON.parse(queueStr) : [];
console.log(`Queue size: ${queue.length}`);
```

### Check Last Update
```typescript
const lastLocation = await SecureStore.getItemAsync('LAST_LOCATION_TOKEN');
const lastUpdate = lastLocation ? JSON.parse(lastLocation) : null;
console.log('Last successful update:', lastUpdate);
```

### Check Pending Updates
```typescript
const pending = await SecureStore.getItemAsync('PENDING_LOCATION_TOKEN');
console.log('Pending update:', pending);
```

## Migration Checklist

- [x] Remove Socket.io dependency from LocationService
- [x] Implement REST API location update
- [x] Add retry logic with exponential backoff
- [x] Create offline queue system
- [x] Implement batch processing
- [x] Add API health checks
- [x] Update error handling
- [x] Remove `sendLocationUpdates` from SocketProvider
- [x] Create `locationAPI.ts` utility module
- [x] Update documentation

## Backend Requirements

Your backend API should support these endpoints:

1. **POST /location/update**
   - Accept single location update
   - Return success/error status
   - Support authentication via token

2. **POST /location/batch-update** (Optional but recommended)
   - Accept array of location updates
   - Process in batch for efficiency
   - Return success count

3. **GET /health** (Recommended)
   - Quick health check endpoint
   - Return 200 for healthy API

## Troubleshooting

### Location updates not sending
1. Check API health: `locationService.checkAPIHealth()`
2. Verify authentication token is valid
3. Check network connectivity
4. Review offline queue size

### Queue growing too large
1. Check backend API availability
2. Verify network connection
3. Review API response times
4. Check for authentication issues

### Service not starting
1. Verify location permissions granted
2. Check notification permissions
3. Review console for error messages
4. Ensure API base URL is configured

## Performance Considerations

- **Battery Impact**: REST API uses less battery than persistent WebSocket
- **Network Usage**: Only sends data when location changes (not continuous connection)
- **Storage**: Queue limited to 100 items to prevent excessive storage use
- **CPU**: Exponential backoff prevents aggressive retries

## Security Notes

- All location data requires authentication token
- Tokens stored securely in SecureStore
- HTTPS enforced for all API calls (via axiosInstance)
- Sensitive data encrypted at rest

## Future Enhancements

Potential improvements for future versions:

1. **Compression**: Compress location data before sending
2. **Deduplication**: Skip updates if location hasn't changed significantly
3. **Adaptive Intervals**: Adjust update frequency based on movement
4. **Priority Queue**: Prioritize recent locations over old ones
5. **Analytics**: Track success/failure rates
6. **Geofencing**: Only update when entering/exiting zones

---

**Last Updated**: December 27, 2025  
**Version**: 2.0.0 (REST API Migration)
