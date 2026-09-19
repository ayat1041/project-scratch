'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { FieldValues, Path, useFormContext } from 'react-hook-form';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@repo/ui/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form';
import { uploadToR2 } from '@repo/utilities/storage/upload-to-r2';

interface OgImageUploadFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  folder?: string;
}

/**
 * Single-image upload field bound to a `GenericForm` by field name. Uploads
 * through the existing `/api/file-upload` route (via `uploadToR2`) and binds
 * the returned public URL to the field.
 */
export const OgImageUploadField = <T extends FieldValues>({
  name,
  label = 'Image',
  folder = 'content/seo',
}: OgImageUploadFieldProps<T>) => {
  const { control, setValue } = useFormContext<T>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadToR2(file, folder);
      onChange(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <div className="flex items-center gap-4">
              {field.value ? (
                <div className="relative h-20 w-32 overflow-hidden rounded-md border bg-muted">
                  <Image src={field.value} alt="" fill unoptimized className="object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : field.value ? 'Replace' : 'Upload'}
                </Button>
                {field.value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue(name, '' as T[typeof name], { shouldDirty: true })}
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileChange(event, field.onChange)}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

OgImageUploadField.displayName = 'OgImageUploadField';
