import { saveAs } from "file-saver";

export function downloadFile(content: string, filename: string, fileType: string) {
  // Prepending a BOM sequence at the beginning of the text file to encoded as UTF-8.
  // const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
  const file = new File([content], filename, { type: fileType });
  saveAs(file);
}

export function formatSize(size: number, pointLength = 2, units?: string[]): string {
  if (typeof size === "undefined") return "0";
  if (typeof units === "undefined")
    units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let unit;
  while ((unit = units.shift() as string) && size >= 1024) size = size / 1024;
  return (
    (unit === units[0]
      ? size
      : size.toFixed(pointLength === undefined ? 2 : pointLength).replace(".00", "")) +
    " " +
    unit
  );
}

export function getTextByteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}
