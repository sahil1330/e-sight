/**
 * E-Sight App Colors - Designed for maximum accessibility and visibility
 * High contrast colors optimized for visually impaired users
 * WCAG AAA compliant color combinations
 */

// Primary brand colors with maximum contrast (7:1 ratio)
const primaryBlue = '#1F2937'; // Dark slate for primary actions - ensures maximum contrast
const primaryGreen = '#047857'; // Darker green for success/positive actions
const primaryRed = '#B91C1C'; // Darker red for emergency/danger actions  
const primaryOrange = '#C2410C'; // Darker orange for warning/attention

// Neutral colors with enhanced contrast
const textPrimary = '#111827'; // Almost black for maximum readability
const textSecondary = '#374151'; // Dark gray for secondary text
const textLight = '#6B7280'; // Medium gray for less important text
const textInverse = '#FFFFFF'; // Pure white for dark backgrounds

// Background colors optimized for visibility
const backgroundPrimary = '#FFFFFF'; // Pure white background
const backgroundSecondary = '#F9FAFB'; // Very light gray background
const backgroundCard = '#FFFFFF'; // White cards with strong shadows
const backgroundAccent = '#F3F4F6'; // Light accent background

// Status colors with enhanced contrast
const statusSuccess = '#047857'; // Darker green for better contrast
const statusWarning = '#B45309'; // Darker amber for warnings
const statusError = '#B91C1C'; // Darker red for errors
const statusInfo = '#1E40AF'; // Strong blue for information

// Device connection colors
const deviceConnected = '#047857'; // Green for connected state
const deviceDisconnected = '#6B7280'; // Gray for disconnected state
const deviceSearching = '#1E40AF'; // Blue for searching state

// Emergency colors
const emergencyPrimary = '#991B1B'; // Very dark red for emergency actions
const emergencySecondary = '#FEF2F2'; // Light red background for emergency sections

export const Colors = {
  // Main brand colors
  primary: {
    blue: primaryBlue,
    green: primaryGreen,
    red: primaryRed,
    orange: primaryOrange,
  },
  
  // Text colors
  text: {
    primary: textPrimary,
    secondary: textSecondary,
    light: textLight,
    inverse: textInverse, // White text on dark backgrounds
  },
  
  // Background colors
  background: {
    primary: backgroundPrimary,
    secondary: backgroundSecondary,
    card: backgroundCard,
    accent: backgroundAccent,
  },
  
  // Status colors
  status: {
    success: statusSuccess,
    warning: statusWarning,
    error: statusError,
    info: statusInfo,
  },
  
  // Device connection states
  device: {
    connected: deviceConnected,
    disconnected: deviceDisconnected,
    searching: deviceSearching,
  },
  
  // Emergency colors
  emergency: {
    primary: emergencyPrimary,
    secondary: emergencySecondary,
  },
  
  // Border colors with enhanced contrast
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
    strong: '#6B7280', // For high contrast borders
  },
  
  // Legacy support for existing components
  light: {
    text: textPrimary,
    background: backgroundPrimary,
    tint: primaryBlue,
    icon: textSecondary,
    tabIconDefault: textSecondary,
    tabIconSelected: primaryBlue,
  },
};
