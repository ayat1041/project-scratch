"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import React from "react";

interface SaveCancelFooterProps {
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  onDiscard?: () => void;
  hasChanges?: boolean;
  isSaveDisabled?: boolean;
  /**
   * Externally-managed saving state (e.g. a consumer tracking its own async
   * submit). OR'd with the footer's own awaited-`onSave` tracking, and also
   * feeds the dialog's close-guard — see `DialogWrapper`'s `handleOpenChange`.
   */
  isSaving?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  discardLabel?: string;
  saveTestId?: string;
  cancelTestId?: string;
  discardTestId?: string;
  /**
   * 'submit' renders the Save button as `type="submit" form={saveFormId}`
   * with no onClick, so it participates in native form submission/validation
   * (including Enter-to-submit) instead of calling `onSave` directly.
   */
  saveButtonType?: "button" | "submit";
  saveFormId?: string;
}

interface DialogWrapperProps {
  /**
   * Element that opens the dialog when clicked. Receives an `onClick` handler.
   * Omit for a fully controlled dialog driven by `open`/`onOpenChange` with no
   * in-place trigger (e.g. one opened from a menu item or a table row action).
   */
  trigger?: React.ReactNode;

  /** Dialog heading shown in the header. Required for accessibility. */
  title: string;

  /** Optional description rendered below the title. */
  description?: React.ReactNode;

  /** Main body content of the dialog. */
  children: React.ReactNode;

  /** Slot rendered inside the sticky footer (e.g. action buttons). Takes precedence over saveCancelFooter. */
  footer?: React.ReactNode;

  /**
   * Convenience footer: renders a Cancel/Discard + Save button pair and
   * manages the in-flight `isSaving` state (including guarding the dialog
   * against closing while a save is pending). Ignored if `footer` is set.
   */
  saveCancelFooter?: SaveCancelFooterProps;

  /** Pixel width of the dialog (default 750). */
  width?: number;

  /** Pixel height of the dialog, or 'auto' to size to content (default 700). */
  height?: number | "auto";

  /** Additional className merged onto the dialog's content element. */
  className?: string;

  /** Forwarded to the underlying Radix dialog content's onOpenAutoFocus. */
  onOpenAutoFocus?: (event: Event) => void;

  /**
   * Controlled open state. When provided the parent owns open/close.
   * Pair with `onOpenChange` to handle changes.
   */
  open?: boolean;

  /** Called when the dialog requests an open-state change. */
  onOpenChange?: (open: boolean) => void;

  /** Test id for the dialog content element. */
  testId?: string;

  /** Test id for the dialog title element. */
  titleTestId?: string;

  /** Test id for the default close ("X") button. */
  closeButtonTestId?: string;

  /**
   * When true, blocks outside-click/Escape/close-button dismissal (e.g. while
   * an async operation the dialog doesn't otherwise track is in flight).
   * Independent of — but combined with — the saveCancelFooter close-guard.
   */
  preventClose?: boolean;
}

function SaveCancelFooter({
  saveCancelFooter,
  isSaving: isAwaitingSave,
  setIsAwaitingSave,
}: {
  saveCancelFooter: SaveCancelFooterProps;
  isSaving: boolean;
  setIsAwaitingSave: (saving: boolean) => void;
}) {
  const {
    onSave,
    onCancel,
    onDiscard,
    hasChanges = false,
    isSaveDisabled = false,
    isSaving: externalIsSaving = false,
    saveLabel = "Save",
    cancelLabel = "Cancel",
    discardLabel = "Discard edits",
    saveTestId,
    cancelTestId,
    discardTestId,
    saveButtonType = "button",
    saveFormId,
  } = saveCancelFooter;

  const isSaving = isAwaitingSave || externalIsSaving;

  const handleSaveClick = async () => {
    if (isSaving || isSaveDisabled) return;
    try {
      setIsAwaitingSave(true);
      await onSave();
    } finally {
      setIsAwaitingSave(false);
    }
  };

  const handleSecondaryAction = () => {
    if (isSaving) return;
    if (hasChanges && onDiscard) {
      onDiscard();
      return;
    }
    onCancel();
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleSecondaryAction}
        disabled={isSaving}
        data-testid={hasChanges && discardTestId ? discardTestId : cancelTestId}
      >
        {hasChanges && onDiscard ? discardLabel : cancelLabel}
      </Button>
      <Button
        type={saveButtonType}
        form={saveFormId}
        onClick={saveButtonType === "button" ? handleSaveClick : undefined}
        disabled={isSaveDisabled || isSaving}
        data-testid={saveTestId}
      >
        {isSaving ? "Saving..." : saveLabel}
      </Button>
    </div>
  );
}

export default function DialogWrapper({
  trigger,
  title,
  description,
  children,
  footer,
  saveCancelFooter,
  width = 750,
  height = 700,
  className,
  onOpenAutoFocus,
  open: controlledOpen,
  onOpenChange,
  testId,
  titleTestId,
  closeButtonTestId,
  preventClose = false,
}: DialogWrapperProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isAwaitingSave, setIsAwaitingSave] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  // Combines the footer's own awaited-onSave tracking with any externally
  // reported saveCancelFooter.isSaving and the standalone preventClose flag.
  const blockClose =
    isAwaitingSave || Boolean(saveCancelFooter?.isSaving) || preventClose;

  const handleOpenChange = (value: boolean) => {
    if (blockClose && !value) return;
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const handleInteractOutsideOrEscape = (event: Event) => {
    if (preventClose) event.preventDefault();
  };

  const resolvedFooter = footer ?? (saveCancelFooter && (
    <SaveCancelFooter
      saveCancelFooter={saveCancelFooter}
      isSaving={isAwaitingSave}
      setIsAwaitingSave={setIsAwaitingSave}
    />
  ));

  return (
    <>
      {/* Trigger — clone to inject onClick. Omitted entirely in controlled-only usage. */}
      {trigger !== undefined &&
        (React.isValidElement(trigger) ? (
          React.cloneElement(
            trigger as React.ReactElement<{ onClick?: () => void }>,
            {
              onClick: () => handleOpenChange(true),
            },
          )
        ) : (
          <span onClick={() => handleOpenChange(true)} className="cursor-pointer">
            {trigger}
          </span>
        ))}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn("border-border flex flex-col overflow-hidden p-0", className)}
          style={{
            width,
            maxWidth: "90vw",
            ...(height !== "auto" ? { height } : {}),
            maxHeight: "90vh",
          }}
          onOpenAutoFocus={onOpenAutoFocus}
          onInteractOutside={handleInteractOutsideOrEscape}
          onEscapeKeyDown={handleInteractOutsideOrEscape}
          data-testid={testId}
          closeButtonTestId={closeButtonTestId}
        >
          {/* Scrollable header + body */}
          <div className="flex-1 overflow-auto px-6.25 pt-6.25 pb-6.25">
            {/* Header */}
            <DialogHeader>
              <DialogTitle data-testid={titleTestId}>{title}</DialogTitle>
              {description && (
                <DialogDescription asChild>
                  <div>{description}</div>
                </DialogDescription>
              )}
            </DialogHeader>

            {/* Body */}
            <div className="pt-6">{children}</div>
          </div>

          {/* Footer */}
          {resolvedFooter && (
            <DialogFooter className="border-t px-6.25 py-4">
              {resolvedFooter}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
