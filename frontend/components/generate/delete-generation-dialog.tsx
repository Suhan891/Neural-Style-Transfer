import { LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GenerationHistoryItem } from "@/lib/generation";

interface DeleteGenerationDialogProps {
  item: GenerationHistoryItem | null;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (item: GenerationHistoryItem) => Promise<boolean>;
}

export function DeleteGenerationDialog({
  item,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: Readonly<DeleteGenerationDialogProps>) {
  const handleConfirm = async () => {
    if (item && (await onConfirm(item))) onClose();
  };

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
    >
      {item && (
        <DialogContent className="border-[#dce2d8] bg-[#fffefa] text-[#203d31]">
          <DialogHeader>
            <DialogTitle>Delete this generation?</DialogTitle>
            <DialogDescription>
              This permanently removes the generated result and its content and
              style images from Cloudinary, then deletes its record.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-[#e2b6a8] bg-[#fbede7] px-3 py-2 text-sm text-[#894631]"
            >
              {error}
            </p>
          )}
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {isDeleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}