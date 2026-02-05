'use client';

import { useState, useEffect, useRef } from 'react';

interface SpeedData {
  speed: number; // in m/s
  speedKmh: number; // in km/h
  accuracy: number | null;
  timestamp: number;
  error: string | null;
}

export function useSpeed() {
  const [speedData, setSpeedData] = useState<SpeedData>({
    speed: 0,
    speedKmh: 0,
    accuracy: null,
    timestamp: Date.now(),
    error: null,
  });
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  useEffect(() => {
    // Check if geolocation is supported
    if ('geolocation' in navigator) {
      setIsSupported(true);
    } else {
      setSpeedData((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startTracking = () => {
    if (!isSupported) {
      setSpeedData((prev) => ({
        ...prev,
        error: 'Geolocation is not supported',
      }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentSpeed = position.coords.speed ?? 0; // m/s
        const speedKmh = currentSpeed * 3.6; // convert to km/h

        // If speed is not available, calculate from position changes
        let calculatedSpeed = currentSpeed;
        if (lastPositionRef.current && currentSpeed === null) {
          const distance = calculateDistance(
            lastPositionRef.current.coords.latitude,
            lastPositionRef.current.coords.longitude,
            position.coords.latitude,
            position.coords.longitude
          );
          const timeDiff = (position.timestamp - lastPositionRef.current.timestamp) / 1000; // seconds
          calculatedSpeed = timeDiff > 0 ? distance / timeDiff : 0;
        }

        setSpeedData({
          speed: calculatedSpeed,
          speedKmh: calculatedSpeed * 3.6,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          error: null,
        });

        lastPositionRef.current = position;
        setIsActive(true);
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setSpeedData((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        setIsActive(false);
      },
      options
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsActive(false);
    }
  };

  // Calculate distance between two coordinates in meters (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return {
    speedData,
    isSupported,
    isActive,
    startTracking,
    stopTracking,
  };
}
