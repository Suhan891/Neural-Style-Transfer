"use client";

import {
  ArrowDownToLine,
  Check,
  ImagePlus,
  LoaderCircle,
  Palette,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface OutputStageProps {
  alpha: number;
  onAlphaChange: (value: number) => void;
  isGenerating: boolean;
  resultUrl: string | null;
  error: string | null;
  canGenerate: boolean;
  onGenerate: () => void;
}

export function OutputStage({
  alpha,
  onAlphaChange,
  isGenerating,
  resultUrl,
  error,
  canGenerate,
  onGenerate,
}: Readonly<OutputStageProps>) {
  return (
    <Card className="flex h-full flex-col border-[#dce2d8] bg-[#fffefa]/95 shadow-[0_16px_44px_-34px_rgba(29,62,48,0.45)]">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-[#203d31]">
            Output stage
          </CardTitle>
          <CardDescription className="text-xs text-[#728077]">
            Generated composition
          </CardDescription>
        </div>
        <Badge
          variant={resultUrl ? "secondary" : "outline"}
          className={
            resultUrl
              ? "bg-[#e6f0e6] text-[#3c6747]"
              : "border-[#dce2d8] text-[#78847a]"
          }
        >
          {isGenerating ? (
            <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
          ) : resultUrl ? (
            <Check className="size-3" aria-hidden="true" />
          ) : (
            <span className="size-1.5 rounded-full bg-[#a9b4a8]" aria-hidden="true" />
          )}
          {isGenerating ? "Rendering" : resultUrl ? "Complete" : "Preview"}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="relative flex aspect-[4/3] min-h-56 flex-1 items-center justify-center overflow-hidden rounded-lg border border-[#e0e4db] bg-[#edf0e8]">
          {resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resultUrl}
              alt="Generated result"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-5 text-center">
              <div className="relative grid size-16 place-items-center rounded-xl border border-[#d4ded2] bg-[#f8f8f1] text-[#53735a] shadow-sm">
                <ImagePlus className="size-7" aria-hidden="true" />
                <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full border-2 border-[#edf0e8] bg-[#c77b57]" />
              </div>
              <p className="text-sm font-medium text-[#365140]">
                Your canvas is ready
              </p>
              <p className="max-w-56 text-xs leading-relaxed text-[#7b877c]">
                Choose two sources to create a new composition.
              </p>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 grid place-items-center bg-[#f5f5ed]/75 backdrop-blur-[2px]">
              <div className="flex items-center gap-2 rounded-full border border-[#dce2d8] bg-white px-4 py-2 text-sm text-[#365140] shadow-sm">
                <LoaderCircle
                  className="size-4 animate-spin text-[#3d7551]"
                  aria-hidden="true"
                />
                Rendering your composition
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-lg bg-[#f4f5ee] p-4">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="alpha"
              className="flex items-center gap-2 text-sm font-medium text-[#365140]"
            >
              <Palette className="size-4 text-[#66816a]" aria-hidden="true" />
              Style strength
            </label>
            <span className="min-w-12 rounded-md bg-white px-2 py-1 text-center font-mono text-xs text-[#315b43] ring-1 ring-[#e0e5dc]">
              {alpha.toFixed(2)}
            </span>
          </div>
          <Slider
            id="alpha"
            min={0}
            max={1}
            step={0.01}
            value={[alpha]}
            onValueChange={(value) =>
              onAlphaChange(typeof value === "number" ? value : (value[0] ?? 0.5))
            }
            aria-label="Style strength"
          />
          <div className="flex justify-between text-[11px] text-[#7b877c]">
            <span>Keep the source</span>
            <span>Lean into style</span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-[#e2b6a8] bg-[#fbede7] px-3 py-2 text-xs text-[#894631]"
          >
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            className="h-10 flex-1 gap-2"
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <WandSparkles className="size-4" aria-hidden="true" />
            )}
            {isGenerating ? "Creating…" : "Generate image"}
          </Button>
          {resultUrl && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              title="Open generated image"
              aria-label="Open generated image"
              render={<a href={resultUrl} target="_blank" rel="noreferrer" />}
            >
              <ArrowDownToLine className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}