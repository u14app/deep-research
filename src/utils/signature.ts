import { Md5 } from "ts-md5";

export function generateSignature(key: string, timestamp: number): string {
  const data = `${key}::${timestamp.toString().substring(0, 8)}`;
  return Md5.hashStr(data);
}

export function verifySignature(signature = "", key: string, timestamp: number): boolean {
  const generatedSignature = generateSignature(key, timestamp);
  return signature === generatedSignature;
}
