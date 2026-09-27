"use client";

import { useState } from "react";
import { Check, Layers3, Palette, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HistoryGallery } from "@/components/generate/history-gallery";
import { HistoryPreviewDialog } from "@/components/generate/history-preview-dialog";
import { DeleteGenerationDialog } from "@/components/generate/delete-generation-dialog";
import { ImageUploadCard } from "@/components/generate/image-upload-card";
import { OutputStage } from "@/components/generate/output-stage";
import { useGenerationWorkspace } from "@/hooks/use-generation-workspace";
import type { GenerationHistoryItem } from "@/lib/generation";

export default function GeneratePage() {
  const workspace = useGenerationWorkspace();
  const [previewItem, setPreviewItem] = useState<GenerationHistoryItem | null>(
    null,
  );
  const [deleteCandidate, setDeleteCandidate] =
    useState<GenerationHistoryItem | null>(null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f1f2e9] text-[#203d31]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(47, 83, 61, 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(47, 83, 61, 0.045) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10">
        <header className="border-b border-[#dce2d8] bg-[#f8f7f0]/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-[#264b38] text-[#f8f5e9] shadow-sm">
                <Layers3 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#203d31]">MORPH</p>
                <p className="text-[11px] text-[#768278]">Neural image studio</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-[#d4ded2] bg-white/70 px-3 py-1 text-[#526a59]"
            >
              {workspace.isAuthenticated ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                <span
                  className="size-1.5 rounded-full bg-[#c16d4d]"
                  aria-hidden="true"
                />
              )}
              {workspace.isAuthenticated ? "Session ready" : "Checking session"}
            </Badge>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8">
          <section className="flex flex-col justify-between gap-5 py-8 sm:flex-row sm:items-end sm:py-10">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-[#a45f44]">
                <Sparkles className="size-4" aria-hidden="true" />
                IMAGE WORKSPACE / 01
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#203d31] sm:text-4xl">
                Compose a new image.
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#68776d]">
                Pair a content source with a visual reference, then tune the blend.
              </p>
            </div>
            <div className="hidden items-center gap-3 pb-1 text-xs text-[#6d7c71] sm:flex">
              <span className="grid size-9 place-items-center rounded-full border border-[#d8e0d5] bg-white/70 text-[#4c7155]">
                <Palette className="size-4" aria-hidden="true" />
              </span>
              <span>
                CONTENT <span className="px-1 text-[#b47a5b]">×</span> STYLE{" "}
                <span className="px-1 text-[#b47a5b]">→</span> RESULT
              </span>
            </div>
          </section>

          {!workspace.isAuthenticated && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-[#e4c4a5] bg-[#fff5e8] px-4 py-3 text-sm text-[#825337]"
            >
              <span
                className="mt-0.5 size-2 shrink-0 rounded-full bg-[#c16d4d]"
                aria-hidden="true"
              />
              Sign in to generate images and view your saved studies.
            </div>
          )}

          <section
            aria-label="Image generation workspace"
            className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,0.82fr)_minmax(22rem,1.25fr)]"
          >
            <ImageUploadCard
              label="Content source"
              hint="JPEG, PNG, WebP · max 3 MB"
              accentLabel="01 / SOURCE"
              slot={workspace.contentSlot}
              onSelect={(file) => workspace.selectImage("content", file)}
              onClear={() => workspace.clearImage("content")}
            />
            <ImageUploadCard
              label="Style reference"
              hint="JPEG, PNG, WebP · max 3 MB"
              accentLabel="02 / STYLE"
              slot={workspace.styleSlot}
              onSelect={(file) => workspace.selectImage("style", file)}
              onClear={() => workspace.clearImage("style")}
            />
            <OutputStage
              alpha={workspace.alpha}
              onAlphaChange={workspace.setAlpha}
              isGenerating={workspace.isGenerating}
              resultUrl={workspace.resultUrl}
              error={workspace.generateError}
              canGenerate={workspace.canGenerate}
              onGenerate={workspace.generateImage}
            />
          </section>

          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-[#a45f44]">
                  YOUR LIBRARY
                </p>
                <h2 className="text-xl font-semibold text-[#203d31]">
                  Previous generations
                </h2>
              </div>
              {workspace.isAuthenticated && (
                <Badge
                  variant="outline"
                  className="border-[#d6dfd4] bg-white/70 text-[#617264]"
                >
                  {workspace.history.length}{" "}
                  {workspace.history.length === 1 ? "study" : "studies"}
                </Badge>
              )}
            </div>
            <Separator className="mb-5 bg-[#dce2d8]" />
            <HistoryGallery
              items={workspace.isAuthenticated ? workspace.history : []}
              isLoading={workspace.isAuthenticated && workspace.historyLoading}
              error={workspace.isAuthenticated ? workspace.historyError : null}
              deleteError={workspace.deleteError}
              deletingImageId={workspace.deletingImageId}
              onSelect={setPreviewItem}
              onDelete={setDeleteCandidate}
            />
          </section>
        </div>
      </div>

      <HistoryPreviewDialog
        item={previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
      />
      <DeleteGenerationDialog
        item={deleteCandidate}
        isDeleting={workspace.deletingImageId === deleteCandidate?.id}
        error={workspace.deleteError}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={workspace.deleteImage}
      />
    </main>
  );
}