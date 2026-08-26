import { Upload, Eye, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import Image from "next/image";

export interface MediaItem {
  id?: string;
  mediaUrl: string;
  mediaType?: string | null;
  title?: string | null;
  description?: string | null;
}

interface MediaUploadSectionProps {
  media: MediaItem[];
  fileUploadError: string | null;
  onFileClick: () => void;
  onPreview: (media: MediaItem) => void;
  onDelete: (mediaId: string) => void;
  onEdit?: (media: MediaItem) => void;
  maxItems?: number;
  label?: string;
  helpText?: string;
  isUploading?: boolean;
  testIds?: {
    uploadArea?: string;
    mediaCard?: string;
    previewButton?: string;
    editButton?: string;
    deleteButton?: string;
  };
}

// Helper function to check if URL is an image
const isImageUrl = (url: string): boolean => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const urlLower = url.toLowerCase();
  return imageExtensions.some((ext) => urlLower.includes(ext));
};

// Helper function to get file extension
const getFileExtension = (url: string): string => {
  const parts = url.split(".");
  const ext = parts[parts.length - 1]?.split("?")[0]?.toUpperCase();
  return ext || "FILE";
};

export const MediaUploadSection = ({
  media,
  fileUploadError,
  onFileClick,
  onPreview,
  onDelete,
  onEdit,
  maxItems = 10,
  label = "Add media (optional)",
  helpText = "*A user may upload up to 10 media items.",
  isUploading = false,
  testIds = {},
}: MediaUploadSectionProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {media.length < maxItems && (
        <div
          onClick={() => {
            if (isUploading) return;
            onFileClick();
          }}
          data-testid={testIds.uploadArea}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            fileUploadError ? "border-destructive" : "border-border"
          } ${isUploading ? "cursor-not-allowed opacity-50" : "hover:bg-muted/50"}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="text-muted-foreground mx-auto mb-2 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Uploading...</p>
            </>
          ) : (
            <>
              <Upload
                className={`mx-auto mb-2 h-8 w-8 ${fileUploadError ? "text-destructive" : "text-muted-foreground"}`}
              />
              <p
                className={`text-sm ${fileUploadError ? "text-destructive" : "text-muted-foreground"}`}
              >
                Upload JPG, JPEG, PNG, PDF, PPT, PPTX, DOC, or DOCX (max. 5 MB)
              </p>
            </>
          )}
        </div>
      )}
      {fileUploadError && (
        <p className="text-sm text-destructive">
          {fileUploadError.replace(/^\*/, "")}
        </p>
      )}
      {helpText && <p className="text-muted-foreground text-xs">{helpText}</p>}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {media.map((mediaItem, index) => {
            const mediaKey = mediaItem.id || String(index);
            const isImage =
              mediaItem.mediaType === "image" || isImageUrl(mediaItem.mediaUrl);
            const fileExt = getFileExtension(mediaItem.mediaUrl);

            return (
              <div
                key={mediaItem.id || mediaItem.mediaUrl}
                data-testid={
                  testIds.mediaCard
                    ? `${testIds.mediaCard}${mediaKey}`
                    : undefined
                }
                className="bg-muted group relative h-[118px] w-[118px] overflow-hidden rounded-lg"
              >
                {isImage ? (
                  <Image
                    src={mediaItem.mediaUrl}
                    alt={mediaItem.title || "Media"}
                    fill
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-muted">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <span className="mt-2 text-xs font-medium text-muted-foreground">
                      {fileExt}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-testid={
                      testIds.previewButton
                        ? `${testIds.previewButton}${mediaKey}`
                        : undefined
                    }
                    className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => onPreview(mediaItem)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {onEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid={
                        testIds.editButton
                          ? `${testIds.editButton}${mediaKey}`
                          : undefined
                      }
                      className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                      onClick={() => onEdit(mediaItem)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-testid={
                      testIds.deleteButton && mediaItem.id
                        ? `${testIds.deleteButton}${mediaItem.id}`
                        : undefined
                    }
                    className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => mediaItem.id && onDelete(mediaItem.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
