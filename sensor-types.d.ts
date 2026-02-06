// Type definitions for Sensor APIs (Gyroscope, Accelerometer)
// These are part of the Generic Sensor API specification

interface SensorOptions {
  frequency?: number;
}

interface Sensor extends EventTarget {
  readonly activated: boolean;
  readonly hasReading: boolean;
  readonly timestamp: number | null;
  start(): void;
  stop(): void;
}

interface Gyroscope extends Sensor {
  readonly x: number | null;
  readonly y: number | null;
  readonly z: number | null;
}

interface Accelerometer extends Sensor {
  readonly x: number | null;
  readonly y: number | null;
  readonly z: number | null;
}

interface Window {
  Gyroscope: {
    new (options?: SensorOptions): Gyroscope;
  };
  Accelerometer: {
    new (options?: SensorOptions): Accelerometer;
  };
}

declare var Gyroscope: {
  new (options?: SensorOptions): Gyroscope;
};

declare var Accelerometer: {
  new (options?: SensorOptions): Accelerometer;
};
