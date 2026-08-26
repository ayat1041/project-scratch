"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, File } from "lucide-react";
import Image from "next/image";
import { MediaPreviewDialog, type MediaItem } from "./MediaPreviewDialog";

interface MediaThumbnailCardProps {
  media: MediaItem;
  /** Thumbnail edge length in px. */
  size?: number;
}

const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1
    ? (parts[parts.length - 1] ?? "FILE").toUpperCase()
    : "FILE";
};

const getFileTypeIcon = (mediaType: string | null, title: string) => {
  if (mediaType === "image") {
    return <ImageIcon className="h-6 w-6 text-muted-foreground" />;
  }

  const ext = getFileExtension(title).toLowerCase();
  if (ext === "pdf") {
    return <FileText className="h-6 w-6 text-destructive" />;
  }
  if (["doc", "docx"].includes(ext)) {
    return <FileText className="h-6 w-6 text-blue-600" />;
  }
  if (["ppt", "pptx"].includes(ext)) {
    return <FileText className="h-6 w-6 text-orange-600" />;
  }
  return <File className="h-6 w-6 text-muted-foreground" />;
};

/**
 * Domain-agnostic media thumbnail: click to open MediaPreviewDialog, image
 * preview or file-type icon otherwise.
 */
export function MediaThumbnailCard({ media, size = 64 }: MediaThumbnailCardProps) {
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const isImage = media.mediaType === "image";

  return (
    <>
      <button
        onClick={() => setIsFullViewOpen(true)}
        className="flex items-center justify-center rounded border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden"
        style={{ width: size, height: size }}
        title={media.title || "Media"}
      >
        {isImage ? (
          <Image
            src={media.mediaUrl}
            alt={media.title || "Media"}
            width={size}
            height={size}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center">
            {getFileTypeIcon(media.mediaType, media.title || media.mediaUrl)}
          </div>
        )}
      </button>

      <MediaPreviewDialog
        open={isFullViewOpen}
        onOpenChange={setIsFullViewOpen}
        media={media}
      />
    </>
  );
}
