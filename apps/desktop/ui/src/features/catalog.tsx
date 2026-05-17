import type { ReactNode } from "react";
import { ResizePanel } from "./resize/ResizePanel";

export type FeatureCategory = "image" | "video";

export interface FeatureDefinition {
  id: string;
  title: string;
  shortLabel: string;
  category: FeatureCategory;
  group: string;
  description: string;
  docsSummary: string;
  keywords: string[];
  render: () => ReactNode;
}

export const categoryMeta: Record<
  FeatureCategory,
  { label: string; accent: string; description: string }
> = {
  image: {
    label: "Image",
    accent: "Pixel",
    description: "Static figure preparation, resizing, conversion, and future annotation helpers."
  },
  video: {
    label: "Video",
    accent: "Motion",
    description: "Clip resizing, frame extraction, FPS conversion, and future sequence workflows."
  }
};

export const featureCatalog: FeatureDefinition[] = [
  {
    id: "image-resize",
    title: "Image Resize",
    shortLabel: "Resize",
    category: "image",
    group: "Transform",
    description:
      "Force images to an exact target size by default, or optionally keep aspect ratio and fit inside the target box.",
    docsSummary:
      "Uses Pillow for exact resize or aspect-ratio-preserving fit-within-box resize.",
    keywords: ["image", "resize", "scale", "stretch", "aspect ratio", "figure"],
    render: () => (
      <ResizePanel
        taskKind="image_resize"
        title="Image Resize"
        description="Force images to an exact target size by default, or optionally keep aspect ratio and fit inside the target box."
        acceptedExtensions={["png", "jpg", "jpeg", "bmp", "tiff", "tif"]}
        outputHint="Choose an image output path such as result.png or result.jpg."
      />
    )
  },
  {
    id: "video-resize",
    title: "Video Resize",
    shortLabel: "Resize",
    category: "video",
    group: "Transform",
    description:
      "Force videos to an exact target size by default, or optionally keep aspect ratio and fit inside the target box without padding.",
    docsSummary:
      "Uses ffprobe to inspect source dimensions and ffmpeg to scale output while resetting SAR for correct playback.",
    keywords: ["video", "resize", "scale", "stretch", "aspect ratio", "movie", "clip"],
    render: () => (
      <ResizePanel
        taskKind="video_resize"
        title="Video Resize"
        description="Force videos to an exact target size by default, or optionally keep aspect ratio and fit inside the target box without padding."
        acceptedExtensions={["mp4", "mov", "mkv", "avi", "webm"]}
        outputHint="Choose a video output path such as resized.mp4."
      />
    )
  }
];

export function matchesFeatureSearch(feature: FeatureDefinition, query: string) {
  const haystack = [
    feature.title,
    feature.shortLabel,
    feature.category,
    feature.group,
    feature.description,
    feature.docsSummary,
    ...feature.keywords
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}
