"use client";

import { ExternalLink, FileText, Image as ImageIcon, File } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import Image from "next/image";
import { cn } from "../../lib/utils";

export interface MediaItem {
  mediaUrl: string;
  mediaType: string | null;
  title?: string | null;
  description?: string | null;
}

interface MediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem | null;
  /** Render the title/description blocks below the preview. */
  showDetails?: boolean;
  className?: string;
}

type MediaKind = "image" | "pdf" | "doc" | "ppt" | "other";

const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1
    ? (parts[parts.length - 1] ?? "FILE").toUpperCase()
    : "FILE";
};

/**
 * Prefers the stored `mediaType` when it says "image", otherwise sniffs the
 * extension off the title or URL.
 */
const getMediaKind = (media: MediaItem): MediaKind => {
  if (media.mediaType === "image") return "image";

  const source = (media.title || media.mediaUrl || "").toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(source)) return "image";
  if (source.includes(".pdf")) return "pdf";
  if (source.includes(".doc") || source.includes(".docx")) return "doc";
  if (source.includes(".ppt") || source.includes(".pptx")) return "ppt";
  return "other";
};

const getFileTypeIcon = (kind: MediaKind) => {
  if (kind === "image") {
    return <ImageIcon className="h-6 w-6 text-muted-foreground" />;
  }
  if (kind === "pdf") {
    return <FileText className="h-6 w-6 text-destructive" />;
  }
  if (kind === "doc") {
    return <FileText className="h-6 w-6 text-info" />;
  }
  if (kind === "ppt") {
    return <FileText className="h-6 w-6 text-warning" />;
  }
  return <File className="h-6 w-6 text-muted-foreground" />;
};

function MediaPreviewBody({ media }: { media: MediaItem }) {
  const kind = getMediaKind(media);

  if (kind === "image") {
    return (
      <Image
        src={media.mediaUrl}
        alt={media.title || "Media"}
        width={1200}
        height={800}
        className="w-full rounded-lg"
      />
    );
  }

  if (kind === "pdf") {
    return (
      <div className="flex flex-col gap-4">
        <iframe
          src={media.mediaUrl}
          className="h-150 w-full rounded-lg border"
          title="PDF Preview"
        />
        <a
          href={media.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-center text-sm hover:underline"
        >
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="bg-muted flex aspect-video flex-col items-center justify-center rounded-lg">
      {getFileTypeIcon(kind)}
      <p className="text-xs text-muted-foreground mt-2">
        {kind === "doc"
          ? "Word Document"
          : kind === "ppt"
            ? "PowerPoint Presentation"
            : `${getFileExtension(media.title || media.mediaUrl)} file`}
      </p>
      {media.mediaUrl && (
        <a
          href={media.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-2 inline-flex items-center gap-2 text-sm hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {kind === "doc" || kind === "ppt" ? "Download to view" : "Open file"}
        </a>
      )}
    </div>
  );
}

export const MediaPreviewDialog = ({
  open,
  onOpenChange,
  media,
  showDetails = true,
  className,
}: MediaPreviewDialogProps) => {
  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("w-150 max-w-[90vw] md:h-fit", className)}>
        <DialogHeader>
          <DialogTitle>Media Preview</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {media.mediaUrl ? (
            <MediaPreviewBody media={media} />
          ) : (
            <div className="bg-muted flex aspect-video items-center justify-center rounded-lg">
              <span className="text-muted-foreground text-sm">
                No preview available
              </span>
            </div>
          )}

          {showDetails && media.title && (
            <div className="mt-4 px-3 py-2 bg-muted rounded-md border border-input">
              <p className="text-sm text-foreground">{media.title}</p>
            </div>
          )}
          {showDetails && media.description && (
            <div className="mt-2 px-3 py-2 bg-muted/50 rounded-md border border-input">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{media.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
