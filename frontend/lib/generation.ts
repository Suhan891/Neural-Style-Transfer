export interface GenerationHistoryItem {
  id: string;
  content_image: string;
  style_image: string;
  generated_image: string;
  created_at?: string;
}

export type ImageSlotKind = "content" | "style";

export interface ImageSlotState {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
}

export const EMPTY_IMAGE_SLOT: ImageSlotState = {
  file: null,
  previewUrl: null,
  error: null,
};

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "File is larger than 3 MB.";
  }
  return null;
}

export function isGenerationHistoryItem(
  value: unknown,
): value is GenerationHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.content_image === "string" &&
    typeof item.style_image === "string" &&
    typeof item.generated_image === "string"
  );
}

export function parseGeneratedImageUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const url = record.url ?? record.generated_image ?? record.image_url;
      if (typeof url === "string") return url;
    }
  } catch {
    return trimmed.replace(/^"|"$/g, "") || null;
  }

  return null;
}

export function formatGenerationDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}