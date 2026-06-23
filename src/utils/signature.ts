import { Md5 } from "ts-md5";

export function generateSignature(key: string, timestamp: number): string {
  const data = `${key}::${timestamp.toString().substring(0, 8)}`;
  return Md5.hashStr(data);
}

export function verifySignature(
  signature = "",
  key: string,
  timestamp: number
): boolean {
  // Check the current 100s window and the previous 100s window (offset by 10^5 ms)
  const generatedSignature = generateSignature(key, timestamp);
  const generatedPreviousSignature = generateSignature(key, timestamp - 100000);
  return signature === generatedSignature || signature === generatedPreviousSignature;
}
