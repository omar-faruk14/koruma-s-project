'use client';

import { useEffect, useState } from 'react';
import { useSpeed } from '../hooks/useSpeed';
import { useGyroscope } from '../hooks/useGyroscope';

export default function WheelchairMonitor() {
  const { speedData, isSupported: speedSupported, isActive: speedActive, startTracking: startSpeed, stopTracking: stopSpeed } = useSpeed();
  const { gyroData, accelData, isSupported: gyroSupported, isActive: gyroActive, startTracking: startGyro, stopTracking: stopGyro, getAccelerationMagnitude, detectAnomaly } = useGyroscope();
  
  const [alert, setAlert] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Check for anomalies periodically
    if (isMonitoring && detectAnomaly()) {
      setAlert('⚠️ POTENTIAL ACCIDENT DETECTED! Sudden acceleration detected.');
      // You can add notification logic here (vibration, sound, etc.)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
  }, [accelData, isMonitoring, detectAnomaly]);

  const handleStart = () => {
    startSpeed();
    startGyro();
    setIsMonitoring(true);
    setAlert(null);
  };

  const handleStop = () => {
    stopSpeed();
    stopGyro();
    setIsMonitoring(false);
    setAlert(null);
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  const getSpeedColor = (speedKmh: number): string => {
    if (speedKmh === 0) return 'text-gray-500';
    if (speedKmh < 5) return 'text-green-500';
    if (speedKmh < 10) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (isActive: boolean): string => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
            🦽 Wheelchair Monitor
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Real-time speed and gyroscope sensor monitoring
          </p>

          {/* Alert Banner */}
          {alert && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 dark:text-red-200 font-semibold text-lg">
                {alert}
              </p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={handleStart}
              disabled={isMonitoring}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isMonitoring
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              ▶ Start Monitoring
            </button>
            <button
              onClick={handleStop}
              disabled={!isMonitoring}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                !isMonitoring
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              ⏹ Stop Monitoring
            </button>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Speed Sensor</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(speedActive)}`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {speedActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {!speedSupported && (
                <p className="text-red-500 text-sm mt-2">⚠️ Not supported</p>
              )}
              {speedData.error && (
                <p className="text-red-500 text-sm mt-2">{speedData.error}</p>
              )}
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Gyroscope Sensor</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(gyroActive)}`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {gyroActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {!gyroSupported && (
                <p className="text-red-500 text-sm mt-2">⚠️ Not supported</p>
              )}
              {gyroData.error && (
                <p className="text-red-500 text-sm mt-2">{gyroData.error}</p>
              )}
            </div>
          </div>

          {/* Speed Display */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-8 mb-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Current Speed</h2>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getSpeedColor(speedData.speedKmh)}`}>
                {formatNumber(speedData.speedKmh)}
              </div>
              <div className="text-white text-lg">km/h</div>
              <div className="text-blue-100 text-sm mt-2">
                {formatNumber(speedData.speed)} m/s
              </div>
              {speedData.accuracy && (
                <div className="text-blue-100 text-xs mt-2">
                  Accuracy: ±{formatNumber(speedData.accuracy)}m
                </div>
              )}
            </div>
          </div>

          {/* Gyroscope Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Gyroscope (rad/s)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">X-axis:</span>
                  <span className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatNumber(gyroData.x)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Y-axis:</span>
                  <span className="font-mono text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatNumber(gyroData.y)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Z-axis:</span>
                  <span className="font-mono text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {formatNumber(gyroData.z)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Accelerometer (m/s²)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">X-axis:</span>
                  <span className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatNumber(accelData.x)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Y-axis:</span>
                  <span className="font-mono text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatNumber(accelData.y)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Z-axis:</span>
                  <span className="font-mono text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {formatNumber(accelData.z)}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Magnitude:</span>
                    <span className="font-mono text-lg font-semibold text-red-600 dark:text-red-400">
                      {formatNumber(getAccelerationMagnitude())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              📱 Instructions:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>This app requires location and motion sensor permissions</li>
              <li>For best results, use on a mobile device with GPS and gyroscope</li>
              <li>The app will detect sudden movements that may indicate an accident</li>
              <li>Make sure location services are enabled on your device</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
