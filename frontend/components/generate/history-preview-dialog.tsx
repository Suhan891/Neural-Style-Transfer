import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatGenerationDate,
  type GenerationHistoryItem,
} from "@/lib/generation";

interface HistoryPreviewDialogProps {
  item: GenerationHistoryItem | null;
  onOpenChange: (open: boolean) => void;
}

export function HistoryPreviewDialog({
  item,
  onOpenChange,
}: Readonly<HistoryPreviewDialogProps>) {
  const date = formatGenerationDate(item?.created_at);

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      {item && (
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto border-[#dce2d8] bg-[#fffefa] p-0 text-[#203d31] sm:max-w-5xl">
          <DialogHeader className="border-b border-[#e3e6dd] px-6 py-5 pr-14">
            <Badge
              variant="secondary"
              className="w-fit bg-[#edf2e8] text-[#48654f]"
            >
              Saved study
            </Badge>
            <DialogTitle className="text-xl text-[#203d31]">
              {date ? `Generated on ${date}` : "Generated result"}
            </DialogTitle>
            <DialogDescription>
              Content and style references used for this result.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 p-6 lg:grid-cols-[1.25fr_.75fr]">
            <figure className="overflow-hidden rounded-lg bg-[#e9ebe3] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.generated_image}
                alt="Full-size generated result"
                className="max-h-[65dvh] w-full rounded-md object-contain"
              />
            </figure>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <figure className="space-y-2">
                <figcaption className="text-xs font-medium text-[#637367]">
                  Content source
                </figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.content_image}
                  alt="Content used for this generation"
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
              </figure>
              <figure className="space-y-2">
                <figcaption className="text-xs font-medium text-[#637367]">
                  Style reference
                </figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.style_image}
                  alt="Style reference used for this generation"
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
              </figure>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}