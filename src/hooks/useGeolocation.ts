import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  watchPosition?: boolean;
}

export interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  isWatching: boolean;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => void;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 10000,
  watchPosition: false,
};

export const useGeolocation = (options: UseGeolocationOptions = {}): UseGeolocationReturn => {
  const opts = { ...defaultOptions, ...options };
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    });
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'Unknown error occurred';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable.';
        break;
      case err.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!isSupported) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: opts.enableHighAccuracy,
      maximumAge: opts.maximumAge,
      timeout: opts.timeout,
    });
  }, [isSupported, handleSuccess, handleError, opts.enableHighAccuracy, opts.maximumAge, opts.timeout]);

  const startWatching = useCallback(() => {
    if (!isSupported) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already watching
    }

    setIsLoading(true);
    setIsWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: opts.enableHighAccuracy,
      maximumAge: opts.maximumAge,
      timeout: opts.timeout,
    });
  }, [isSupported, handleSuccess, handleError, opts.enableHighAccuracy, opts.maximumAge, opts.timeout]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Start watching automatically if watchPosition is enabled
  useEffect(() => {
    if (opts.watchPosition) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [opts.watchPosition, startWatching, stopWatching]);

  return {
    position,
    error,
    isLoading,
    isSupported,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
};

// Utility: Calculate distance between two GPS coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Utility: Check if user is within radius of a waypoint
export const isNearWaypoint = (
  userLat: number, userLon: number,
  waypointLat: number, waypointLon: number,
  radiusMeters: number = 15
): boolean => {
  const distance = calculateDistance(userLat, userLon, waypointLat, waypointLon);
  return distance <= radiusMeters;
};

// Utility: Convert campus grid position to approximate GPS coordinates
// This maps the 0-100 grid to GPS bounds (adjust these for actual campus)
export const gridToGPS = (
  gridX: number, 
  gridY: number,
  campusBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }
): { latitude: number; longitude: number } => {
  const latitude = campusBounds.maxLat - (gridY / 100) * (campusBounds.maxLat - campusBounds.minLat);
  const longitude = campusBounds.minLon + (gridX / 100) * (campusBounds.maxLon - campusBounds.minLon);
  return { latitude, longitude };
};

// Utility: Convert GPS to campus grid position
export const gpsToGrid = (
  latitude: number,
  longitude: number,
  campusBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }
): { x: number; y: number } => {
  const x = ((longitude - campusBounds.minLon) / (campusBounds.maxLon - campusBounds.minLon)) * 100;
  const y = ((campusBounds.maxLat - latitude) / (campusBounds.maxLat - campusBounds.minLat)) * 100;
  return { 
    x: Math.max(0, Math.min(100, x)), 
    y: Math.max(0, Math.min(100, y)) 
  };
};
