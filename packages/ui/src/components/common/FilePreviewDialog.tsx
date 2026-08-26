import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Download, FileText, Loader2 } from "lucide-react";
import React, { useState } from "react";

// Helper to determine file type from URL or mediaType
const getFileType = (
  url: string | null,
  mediaType: string | null,
): "image" | "pdf" | "other" => {
  // Check mediaType first
  if (mediaType) {
    if (mediaType.startsWith("image/")) return "image";
    if (mediaType === "application/pdf") return "pdf";
  }

  // Fallback to URL extension
  if (url) {
    const ext = url.toLowerCase().split(".").pop()?.split("?")[0] || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext))
      return "image";
    if (ext === "pdf") return "pdf";
  }

  return "other";
};

// File Preview Dialog Component
interface FilePreviewDialogProps {
  doc: {
    title: string | null;
    description: string | null | undefined;
    mediaUrl: string | null;
    mediaType: string | null;
  };
  label: string;
  showDownloadIcon?: boolean;
}

export default function FilePreviewDialog({
  doc,
  label,
}: FilePreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const fileType = getFileType(doc.mediaUrl, doc.mediaType);
  const previewUrl = doc.mediaUrl;

  const handleDownload = async () => {
    if (!previewUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      // Use image-proxy API to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(previewUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = doc.title || "download";
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog>
      <div className="text-primary inline-flex items-center gap-1.5">
        <DialogTrigger asChild>
          <button
            type="button"
            className="hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
            aria-label={`Preview ${doc.title || label}`}
          >
            {label}
          </button>
        </DialogTrigger>
        <button
          type="button"
          aria-label={`Download ${doc.title || label}`}
          title={`Download ${doc.title}`}
          onClick={handleDownload}
          disabled={isDownloading}
          className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      </div>
      <DialogContent
        className={fileType === "pdf" ? "h-[85vh] max-w-4xl" : "max-w-2xl"}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{doc.title}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* Preview Content */}
          {fileType === "image" && previewUrl && (
            <div className="bg-muted flex max-h-[70vh] items-center justify-center overflow-auto rounded-md p-4">
              <img
                src={previewUrl}
                alt={doc.title || "Preview"}
                className="h-auto max-w-full object-contain"
                style={{ maxHeight: "65vh" }}
              />
            </div>
          )}
          {fileType === "pdf" && previewUrl && (
            <div className="min-h-0 flex-1">
              <iframe
                src={previewUrl}
                title={doc.title || "PDF Preview"}
                className="h-full w-full rounded-md border"
                style={{ minHeight: "60vh" }}
              />
            </div>
          )}
          {fileType === "other" && (
            <div className="bg-muted flex aspect-video flex-col items-center justify-center gap-2 rounded-md">
              <FileText className="text-muted-foreground h-12 w-12" />
              <span className="text-muted-foreground text-sm">
                Preview not available
              </span>
            </div>
          )}
          {/* Download Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
