import type { CalibrationSettings } from '../types';

export function calibrationEquals(a: CalibrationSettings, b: CalibrationSettings): boolean {
  return (
    a.horizontalOffset === b.horizontalOffset &&
    a.verticalOffset === b.verticalOffset &&
    a.scaleX === b.scaleX &&
    a.scaleY === b.scaleY
  );
}
