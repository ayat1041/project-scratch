"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

interface AlertDialogWrapperProps {
  /** Controlled open state. */
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** Dialog heading. */
  title: React.ReactNode;

  /** Supporting description shown below the title. */
  description?: React.ReactNode;

  /** Label for the confirm (destructive / primary) button. Defaults to "Yes". */
  confirmLabel?: string;

  /** Label for the cancel button. Defaults to "No". */
  cancelLabel?: string;

  /** Called when the user confirms. Can be async. */
  onConfirm: () => void | Promise<void>;

  /** Whether the confirm action is loading (for async operations) */
  isLoading?: boolean;

  contentTestId?: string;

  /** Optional data-testid for the cancel button. */
  cancelTestId?: string;

  /** Optional data-testid for the confirm button. */
  confirmTestId?: string;

  /**
   * Extra content rendered between the header and the footer — e.g. an
   * optional message field on a confirmation. Omit for a plain confirm dialog.
   */
  children?: React.ReactNode;
}

export default function AlertDialogWrapper({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
  isLoading = false,
  cancelTestId = "dialog-cancel-button",
  confirmTestId = "dialog-confirm-button",
  contentTestId = "dialog-content",
  children,
}: AlertDialogWrapperProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setInternalLoading(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error in confirm handler:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="max-h-[90vh] overflow-y-auto bg-white"
        data-testid={contentTestId}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-anywhere whitespace-normal">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="wrap-anywhere whitespace-normal text-[#6B7280]">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="flex-wrap gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={loading}
            data-testid={cancelTestId}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            data-testid={confirmTestId}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
