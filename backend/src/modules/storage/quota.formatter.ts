export const BYTES_IN_KB = 1024;
export const BYTES_IN_MB = BYTES_IN_KB * 1024;
export const BYTES_IN_GB = BYTES_IN_MB * 1024;

export function bytesToMB(bytes: number): string {
  return (bytes / BYTES_IN_MB).toFixed(2);
}
