"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ImageSlotState } from "@/lib/generation";

interface ImageUploadCardProps {
  label: string;
  hint: string;
  accentLabel: string;
  slot: ImageSlotState;
  onSelect: (file: File) => void;
  onClear: () => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/jpg,image/png,image/webp";

export function ImageUploadCard({
  label,
  hint,
  accentLabel,
  slot,
  onSelect,
  onClear,
}: Readonly<ImageUploadCardProps>) {
  const inputId = `slot-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onSelect(file);
  };

  const dropAreaClass = isDragOver
    ? "border-[#38785c] bg-[#e9f2e9]"
    : slot.previewUrl
      ? "border-[#dce2d8] bg-[#f3f3ec]"
      : "border-[#cbd6ca] bg-[#f4f5ee] hover:border-[#839987]";

  return (
    <Card className="overflow-hidden border-[#dce2d8] bg-[#fffefa]/90 shadow-[0_12px_40px_-30px_rgba(29,62,48,0.35)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-[#1e3e32]">
            {label}
          </CardTitle>
          <CardDescription className="text-xs text-[#728077]">
            {hint}
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 border-[#d8e1d7] bg-[#f3f6ef] text-[#496551]"
        >
          {accentLabel}
        </Badge>
      </CardHeader>

      <CardContent>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors ${dropAreaClass}`}
        >
          {slot.previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.previewUrl}
                alt={`${label} preview`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#142d24]/85 to-transparent p-3 pt-10">
                <p className="max-w-[60%] truncate text-xs font-medium text-white">
                  {slot.file?.name}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => inputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    onClick={onClear}
                    aria-label={`Remove ${label}`}
                    title={`Remove ${label}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-3 p-5 text-center text-[#6f8075] outline-none transition-colors hover:text-[#315b43] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38785c]"
            >
              <span className="grid size-11 place-items-center rounded-full bg-white text-[#39704f] shadow-sm ring-1 ring-[#e0e7dc]">
                <Upload className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-[#294637]">
                Drop a file or browse
              </span>
              <span className="text-xs text-[#78857b]">{hint}</span>
            </button>
          )}

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES}
            className="sr-only"
            aria-label={`Choose ${label}`}
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        {slot.error && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-700">
            {slot.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}