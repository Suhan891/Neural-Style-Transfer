import { ArrowUpRight, Clock3, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatGenerationDate,
  type GenerationHistoryItem,
} from "@/lib/generation";

interface HistoryGalleryProps {
  items: GenerationHistoryItem[];
  isLoading: boolean;
  error: string | null;
  deleteError: string | null;
  deletingImageId: string | null;
  onSelect: (item: GenerationHistoryItem) => void;
  onDelete: (item: GenerationHistoryItem) => void;
}

export function HistoryGallery({
  items,
  isLoading,
  error,
  deleteError,
  deletingImageId,
  onSelect,
  onDelete,
}: Readonly<HistoryGalleryProps>) {
  if (isLoading) {
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index}>
            <Card className="overflow-hidden border-[#dce2d8] bg-[#fffefa] p-0">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-[#dcae9d] bg-[#fbede7] px-4 py-3 text-sm text-[#894631]"
      >
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {deleteError && (
          <p role="alert" className="mb-4 rounded-lg border border-[#dcae9d] bg-[#fbede7] px-4 py-3 text-sm text-[#894631]">
            {deleteError}
          </p>
        )}
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#cbd6ca] bg-[#f8f8f1]/75 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-white text-[#4f735b] ring-1 ring-[#dfe6dc]">
            <ImagePlus className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm text-[#65766a]">
            Your saved studies will appear here.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {deleteError && (
        <p role="alert" className="mb-4 rounded-lg border border-[#dcae9d] bg-[#fbede7] px-4 py-3 text-sm text-[#894631]">
          {deleteError}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => {
        const date = formatGenerationDate(item.created_at);
        const buttonLabel = date
          ? `Open generation from ${date}`
          : "Open generation";

        return (
          <li key={item.id}>
            <Card className="group overflow-hidden border-[#dce2d8] bg-[#fffefa] p-0 transition-shadow hover:shadow-[0_12px_35px_-22px_rgba(29,62,48,0.5)]">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#39704f]"
                  aria-label={buttonLabel}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#e9ebe3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.generated_image}
                      alt="Previously generated result"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute bottom-2 left-2 flex -space-x-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.content_image}
                        alt=""
                        className="size-8 rounded-md border-2 border-white object-cover shadow"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.style_image}
                        alt=""
                        className="size-8 rounded-md border-2 border-white object-cover shadow"
                      />
                    </div>
                    <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-[#315b43] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <CardContent className="flex items-center justify-between gap-2 py-3 pr-11">
                    <span className="truncate text-xs font-medium text-[#365140]">
                      Style study {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#77837a]">
                      {date && <Clock3 className="size-3" aria-hidden="true" />}
                      {date ?? "Saved"}
                    </span>
                  </CardContent>
                </button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="destructive"
                  disabled={deletingImageId !== null}
                  onClick={() => onDelete(item)}
                  aria-label={`Delete generation ${String(index + 1).padStart(2, "0")}`}
                  title="Delete generation"
                  className="absolute right-2 top-2 opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  {deletingImageId === item.id ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 aria-hidden="true" />
                  )}
                </Button>
              </div>
            </Card>
          </li>
        );
      })}
      </ul>
    </>
  );
}