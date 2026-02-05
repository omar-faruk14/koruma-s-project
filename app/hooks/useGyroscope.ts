'use client';

import { useState, useEffect, useRef } from 'react';

interface GyroData {
  x: number; // rotation around x-axis (rad/s)
  y: number; // rotation around y-axis (rad/s)
  z: number; // rotation around z-axis (rad/s)
  timestamp: number;
  error: string | null;
}

interface AccelerationData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export function useGyroscope() {
  const [gyroData, setGyroData] = useState<GyroData>({
    x: 0,
    y: 0,
    z: 0,
    timestamp: Date.now(),
    error: null,
  });
  const [accelData, setAccelData] = useState<AccelerationData>({
    x: 0,
    y: 0,
    z: 0,
    timestamp: Date.now(),
  });
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const sensorRef = useRef<Gyroscope | null>(null);
  const accelRef = useRef<Accelerometer | null>(null);

  useEffect(() => {
    // Check if sensors are supported
    if (typeof window !== 'undefined') {
      const gyroSupported = 'Gyroscope' in window;
      const accelSupported = 'Accelerometer' in window;
      setIsSupported(gyroSupported || accelSupported);

      if (!gyroSupported && !accelSupported) {
        setGyroData((prev) => ({
          ...prev,
          error: 'Gyroscope and Accelerometer are not supported by your device',
        }));
      }
    }

    return () => {
      if (sensorRef.current) {
        sensorRef.current.stop();
        sensorRef.current = null;
      }
      if (accelRef.current) {
        accelRef.current.stop();
        accelRef.current = null;
      }
    };
  }, []);

  const startTracking = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Request device orientation permission (if needed)
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission !== 'granted') {
          setGyroData((prev) => ({
            ...prev,
            error: 'Device orientation permission denied',
          }));
          return;
        }
      }

      // Try to use Gyroscope API
      if ('Gyroscope' in window) {
        const gyro = new Gyroscope({ frequency: 60 });
        
        gyro.addEventListener('reading', () => {
          setGyroData({
            x: gyro.x ?? 0,
            y: gyro.y ?? 0,
            z: gyro.z ?? 0,
            timestamp: Date.now(),
            error: null,
          });
          setIsActive(true);
        });

        gyro.addEventListener('error', (event: any) => {
          setGyroData((prev) => ({
            ...prev,
            error: `Gyroscope error: ${event.error?.message || 'Unknown error'}`,
          }));
          setIsActive(false);
        });

        sensorRef.current = gyro;
        gyro.start();
      }

      // Also use Accelerometer for fall detection
      if ('Accelerometer' in window) {
        const accel = new Accelerometer({ frequency: 60 });
        
        accel.addEventListener('reading', () => {
          setAccelData({
            x: accel.x ?? 0,
            y: accel.y ?? 0,
            z: accel.z ?? 0,
            timestamp: Date.now(),
          });
        });

        accel.addEventListener('error', (event: any) => {
          console.error('Accelerometer error:', event.error);
        });

        accelRef.current = accel;
        accel.start();
      }

      // Fallback: Use DeviceOrientationEvent if Sensor APIs are not available
      if (!('Gyroscope' in window) && !('Accelerometer' in window)) {
        const handleOrientation = (event: DeviceOrientationEvent) => {
          setGyroData({
            x: (event.beta ?? 0) * (Math.PI / 180), // Convert degrees to radians
            y: (event.gamma ?? 0) * (Math.PI / 180),
            z: (event.alpha ?? 0) * (Math.PI / 180),
            timestamp: Date.now(),
            error: null,
          });
          setIsActive(true);
        };

        window.addEventListener('deviceorientation', handleOrientation);
        setIsActive(true);

        return () => {
          window.removeEventListener('deviceorientation', handleOrientation);
        };
      }
    } catch (error: any) {
      setGyroData((prev) => ({
        ...prev,
        error: `Failed to start gyroscope: ${error.message}`,
      }));
      setIsActive(false);
    }
  };

  const stopTracking = () => {
    if (sensorRef.current) {
      sensorRef.current.stop();
      sensorRef.current = null;
    }
    if (accelRef.current) {
      accelRef.current.stop();
      accelRef.current = null;
    }
    setIsActive(false);
  };

  // Calculate magnitude of acceleration (useful for fall detection)
  const getAccelerationMagnitude = (): number => {
    return Math.sqrt(accelData.x ** 2 + accelData.y ** 2 + accelData.z ** 2);
  };

  // Detect potential fall/accident based on sudden acceleration change
  const detectAnomaly = (): boolean => {
    const magnitude = getAccelerationMagnitude();
    // Threshold: if acceleration magnitude exceeds 2g (19.6 m/s²), it might be a fall
    return magnitude > 19.6;
  };

  return {
    gyroData,
    accelData,
    isSupported,
    isActive,
    startTracking,
    stopTracking,
    getAccelerationMagnitude,
    detectAnomaly,
  };
}
