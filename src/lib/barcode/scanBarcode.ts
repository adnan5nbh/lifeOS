import { BrowserMultiFormatReader } from "@zxing/browser";

export async function scanBarcodeFromImage(dataUrl: string): Promise<string | null> {
  const reader = new BrowserMultiFormatReader();
  try {
    const result = await reader.decodeFromImageUrl(dataUrl);
    return result.getText();
  } catch {
    return null;
  }
}
