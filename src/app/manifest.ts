import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const manifest = {
    name: "LifeOS",
    short_name: "LifeOS",
    version: "1.1.0",
    description: "Your adaptive daily schedule, health tracker, and AI assistant.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return manifest as MetadataRoute.Manifest;
}
