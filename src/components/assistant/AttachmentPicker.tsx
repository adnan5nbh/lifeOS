"use client";

import { useRef } from "react";

export interface ImageAttachment {
  mimeType: string;
  base64: string;
  dataUrl: string;
}

const MAX_DIMENSION = 1568;

async function resizeImage(file: File): Promise<ImageAttachment> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load image"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
  const base64 = resizedDataUrl.split(",")[1];

  return { mimeType: "image/jpeg", base64, dataUrl: resizedDataUrl };
}

export default function AttachmentPicker({
  onAttach,
}: {
  onAttach: (attachment: ImageAttachment) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const attachment = await resizeImage(file);
    onAttach(attachment);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFile}
      />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        title="Take a photo"
        className="rounded-lg px-2 py-2 text-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        📷
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Upload image"
        className="rounded-lg px-2 py-2 text-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        📎
      </button>
    </>
  );
}
