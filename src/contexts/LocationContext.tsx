import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  userLocation: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  permissionState: PermissionState | null;
  requestLocation: () => Promise<void>;
  calculateDistance: (lat: number, lng: number) => string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Haversine formula to calculate distance between two points
function haversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return value * (Math.PI / 180);
}

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  // Check if geolocation is available
  const isGeolocationAvailable = 'geolocation' in navigator;

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (!isGeolocationAvailable) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(result.state);
        
        // Listen for permission changes
        result.onchange = () => {
          setPermissionState(result.state);
          if (result.state === 'granted') {
            requestLocation();
          }
        };

        // If permission is already granted, get location
        if (result.state === 'granted') {
          requestLocation();
        }
      } catch (err) {
        // Permissions API might not be available in all browsers
        console.log('Permissions API not available, will request on demand');
      }
    };

    checkPermission();
  }, []);

  const requestLocation = useCallback(async () => {
    if (!isGeolocationAvailable) {
      setError('Geolocation is not supported');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache for 1 minute
        });
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setPermissionState('granted');

      // Store in localStorage for persistence
      localStorage.setItem('lastKnownLocation', JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now(),
      }));
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          setError('Location access denied');
          setPermissionState('denied');
          break;
        case geoError.POSITION_UNAVAILABLE:
          setError('Location unavailable');
          break;
        case geoError.TIMEOUT:
          setError('Location request timed out');
          break;
        default:
          setError('Failed to get location');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isGeolocationAvailable]);

  // Try to restore last known location on mount
  useEffect(() => {
    const stored = localStorage.getItem('lastKnownLocation');
    if (stored) {
      try {
        const { latitude, longitude, timestamp } = JSON.parse(stored);
        // Only use if less than 30 minutes old
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          setUserLocation({ latitude, longitude });
        }
      } catch (e) {
        // Invalid stored data
      }
    }
  }, []);

  const calculateDistance = useCallback((lat: number, lng: number): string | null => {
    if (!userLocation) return null;
    
    const distance = haversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lng
    );
    
    return formatDistance(distance);
  }, [userLocation]);

  return (
    <LocationContext.Provider value={{
      userLocation,
      isLoading,
      error,
      permissionState,
      requestLocation,
      calculateDistance,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
