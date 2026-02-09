# AI Image Description Feature

## Overview

The AI Image Description feature empowers visually impaired users to understand their surroundings by capturing photos and receiving detailed, spoken descriptions powered by Google's Gemini AI.

## Features

### Core Functionality

- **Camera Integration**: Easy-to-use camera interface with large, accessible buttons
- **AI-Powered Descriptions**: Comprehensive image analysis using Gemini 2.5 Flash model
- **Text-to-Speech**: Automatic voice narration of image descriptions
- **Accessibility First**: Designed with screen reader compatibility and voice guidance

### What the AI Describes

1. Main subject or focal point
2. Objects and their positions (left, right, foreground, background)
3. People and their activities
4. Colors, lighting, and atmosphere
5. Visible text or signs
6. Potential hazards or safety information
7. Overall scene and setting

## Setup Instructions

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure the Application

1. Create or edit your `.env.local` file in the project root
2. Add the following line:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### 3. Rebuild the Application

After adding the API key, rebuild your application:

```bash
# For development
npm run dev

# For production builds
npm run android  # or npm run ios
```

## How to Use

### For Blind Users

1. **Open the App**: Navigate to the home screen
2. **Find AI Vision Assistant**: Located in the third section of the home screen
3. **Tap "Describe What I See"**: The camera will open
4. **Capture the Image**: Tap the large circular button at the bottom
5. **Listen to Description**: The AI will automatically speak the description
6. **Review if Needed**: The description text is also displayed on screen

### Camera Controls

- **Close Button** (top-left): Exit camera without taking a picture
- **Flip Camera Button** (top-right): Switch between front and back camera
- **Capture Button** (center-bottom): Large purple circular button to take picture

### Additional Features

- **Replay Description**: Tap the speaker icon to hear the description again
- **Stop Speaking**: Tap the stop icon while description is being read
- **ScrollableDescription**: Swipe up/down to read longer descriptions

## API Functions Available

The `geminiAPI.ts` utility provides multiple functions:

### 1. Full Description (Default)

```typescript
describeImage(base64Image, mimeType);
```

Provides comprehensive, detailed description optimized for visually impaired users.

### 2. Quick Description

```typescript
getQuickDescription(base64Image, mimeType);
```

Returns a brief, one-sentence summary of the image.

### 3. Object Identification

```typescript
identifyObjects(base64Image, mimeType);
```

Lists all visible objects in bulleted format.

### 4. Text Extraction (OCR)

```typescript
readTextFromImage(base64Image, mimeType);
```

Extracts and reads all visible text from the image.

## Technical Details

### Dependencies

- `@google/genai`: Google's Generative AI SDK
- `expo-camera`: Camera functionality
- `expo-speech`: Text-to-speech capabilities

### Model Used

- **Gemini 2.5 Flash** - Latest stable multimodal model (Released June 2025)
- Supports up to 1M token context window
- Fast and efficient for image analysis
- Free tier available with generous limits

### Supported Image Formats

- JPEG
- PNG
- WebP
- HEIF (on supported devices)

### Performance

- Image quality set to 70% for optimal balance between quality and speed
- Average processing time: 2-5 seconds
- Requires active internet connection

## Privacy & Security

- **Image Processing**: Images are sent to Google's Gemini API for processing
- **No Storage**: Images are not stored on device or servers
- **API Key Security**: Store API key in environment variables, never in code
- **Data Usage**: Each API call consumes data; use on WiFi when possible

## Accessibility Features

### Screen Reader Support

- All buttons have accessibility labels and hints
- Descriptions are read automatically for screen reader users
- Clear, descriptive button names

### Voice Guidance

- Automatic text-to-speech for all descriptions
- Adjustable speech rate (currently 0.9x for clarity)
- Pause/resume capability

### Visual Design

- High contrast buttons
- Large touch targets
- Clear visual feedback during processing
- Responsive design for all screen sizes

## Troubleshooting

### "Analysis Failed" Error

- **Check Internet**: Ensure stable internet connection
- **Verify API Key**: Confirm EXPO_PUBLIC_GEMINI_API_KEY is set correctly
- **API Limits**: Check if you've exceeded free tier limits at [Google AI Studio](https://aistudio.google.com/)

### Camera Won't Open

- **Permissions**: Grant camera permissions in device settings
- **Restart App**: Close and reopen the application
- **Check Device**: Ensure device camera is functioning

### No Speech Output

- **Volume**: Check device volume is not muted
- **Permissions**: Some devices require microphone permissions for TTS
- **Language**: Ensure device supports English TTS

### Description Quality Issues

- **Lighting**: Ensure adequate lighting for better image capture
- **Focus**: Keep camera steady while capturing
- **Distance**: Position camera appropriately to subject
- **Retry**: Capture again if description seems inaccurate

## API Usage & Costs

### Free Tier (Gemini API)

- 60 requests per minute
- 1,500 requests per day
- 1 million requests per month

For most users, the free tier is sufficient. Monitor usage at [Google AI Studio](https://aistudio.google.com/).

## Future Enhancements

Potential features for future versions:

- Multi-language support
- Offline mode with on-device AI
- Image history and favorites
- Scene recognition categories
- Color identification mode
- Currency recognition
- Face recognition (with consent)

## Support

For issues or questions:

1. Check this documentation
2. Review error messages
3. Check API key configuration
4. Verify internet connection
5. Contact development team

## Related Files

- **Component**: `components/Home/ImageDescription.tsx`
- **API Service**: `utils/geminiAPI.ts`
- **Integration**: `components/Home/BlindHomeComponent.tsx`
- **Environment**: `.env.example` (template), `.env.local` (your configuration)
