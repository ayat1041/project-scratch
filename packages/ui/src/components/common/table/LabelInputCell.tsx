"use client";

import React, { useState, useEffect } from "react";
import { TableCell } from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Check, Loader2, Pencil } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { validateXSS, sanitizeHtmlContent } from "@repo/utilities/security/sanitize";

import { LabelInputCellProps } from "./LabelInputCell.types";

/**
 * Generic LabelInputCell Component
 *
 * @description
 * A reusable table cell component for inline label editing with validation.
 * Supports optimistic UI updates, real-time validation, and keyboard shortcuts.
 *
 * ```
 */
export default function LabelInputCell<TItem>({
  item,
  getLabel,
  getId,
  isDisabled: isDisabledFn,
  validateLabel,
  onSave,
  badge = null,
  placeholder = "Add label...",
  disabledPlaceholder = "Label disabled",
  disabledTitle = "Cannot edit label",
  className = "",
  inputClassName = "",
}: LabelInputCellProps<TItem>) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabelValue, setTempLabelValue] = useState<string>("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [displayedLabel, setDisplayedLabel] = useState<string | null>(
    getLabel(item) || null,
  );

  const isDisabled = isDisabledFn(item);
  const itemId = getId(item);

  useEffect(() => {
    setDisplayedLabel(getLabel(item) || null);
  }, [getLabel, item]);

  useEffect(() => {
    if (!isEditing && labelError) {
      const timer = setTimeout(() => setLabelError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [isEditing, labelError]);

  const handleValidateLabel = (label: string): string | null => {
    // First, check for XSS attempts (security layer)
    const xssError = validateXSS(label);
    if (xssError) {
      return xssError;
    }

    // Then run custom validation
    return validateLabel(label, item);
  };

  const handleSaveLabel = async () => {
    // Run validation
    const validationError = handleValidateLabel(tempLabelValue);
    if (validationError) {
      setLabelError(validationError);
      return;
    }

    // Sanitize the input to remove any potential XSS content
    const sanitizedLabel = sanitizeHtmlContent(tempLabelValue);

    const previousLabel = displayedLabel;

    // Optimistic UI update — null reverts to the empty/placeholder state
    setDisplayedLabel(sanitizedLabel || null);
    setIsEditing(false);
    setTempLabelValue("");
    setLabelError(null);

    setIsSaving(true);
    try {
      const success = await onSave(itemId, sanitizedLabel);

      if (!success) {
        // Rollback on failure
        setDisplayedLabel(previousLabel);
        setLabelError("Couldn't save. Try again.");
      }
    } catch (error) {
      console.error("Couldn't save label:", error);
      // Rollback on error
      setDisplayedLabel(previousLabel);
      setLabelError("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditing = () => {
    if (isDisabled) return;
    setIsEditing(true);
    setTempLabelValue(displayedLabel || "");
    setLabelError(null);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setTempLabelValue("");
    setLabelError(null);
  };

  const handleBlur = () => {
    const trimmed = tempLabelValue.trim();
    const original = displayedLabel?.trim() || "";

    if (trimmed === original) {
      // No change — exit edit mode without saving
      handleCancelEditing();
    } else if (!labelError) {
      // Value changed (including clearing an existing label) — save
      handleSaveLabel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = tempLabelValue.trim();
      const original = displayedLabel?.trim() || "";
      if (trimmed !== original) {
        handleSaveLabel();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEditing();
    }
  };

  return (
    <TableCell className={cn("border-t pl-6", className)}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {!isEditing ? (
            displayedLabel ? (
              <div className="flex items-center gap-2 break-all">
                <button
                  type="button"
                  className={cn(
                    "rounded-full border border-transparent p-1 transition-colors",
                    isDisabled || isSaving
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-blue-300",
                  )}
                  onClick={handleStartEditing}
                  disabled={isDisabled || isSaving}
                  title={
                    isDisabled
                      ? disabledTitle
                      : isSaving
                        ? "Saving..."
                        : "Edit label"
                  }
                  data-testid={`edit-button-${itemId}`}
                >
                  {isSaving ? (
                    <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                  ) : (
                    <Pencil className="text-muted-foreground h-3 w-3" />
                  )}
                </button>
                <span
                  className={cn(
                    "text-sm truncate max-w-30",
                    isDisabled && "opacity-50",
                  )}
                >
                  {displayedLabel}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center">
                  {isSaving && (
                    <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                  )}
                </div>
                <Input
                  value=""
                  onFocus={handleStartEditing}
                  className={cn("h-7 w-32 text-sm", inputClassName)}
                  placeholder={isDisabled ? disabledPlaceholder : placeholder}
                  readOnly
                  disabled={isDisabled || isSaving}
                  title={
                    isDisabled
                      ? disabledTitle
                      : isSaving
                        ? "Saving..."
                        : undefined
                  }
                  data-testid={`label-input-${itemId}`}
                />
              </div>
            )
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center">
                {tempLabelValue.trim().length > 0 && (
                  <button
                    type="button"
                    className="rounded-full border border-transparent p-1 transition-colors hover:border-green-300 disabled:opacity-50"
                    onClick={handleSaveLabel}
                    disabled={isSaving}
                    data-testid={`save-button-${itemId}`}
                  >
                    {isSaving ? (
                      <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="text-muted-foreground h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
              <Input
                value={tempLabelValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setTempLabelValue(newValue);
                  // Validate on every keystroke
                  setLabelError(handleValidateLabel(newValue));
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn("h-7 w-32 text-sm", inputClassName)}
                placeholder={placeholder}
                disabled={isSaving}
                autoFocus
                data-testid={`label-edit-input-${itemId}`}
              />
            </div>
          )}

          {badge && (
            <Badge
              variant={badge.variant || "outline"}
              className={badge.className}
            >
              {badge.text}
            </Badge>
          )}
        </div>
        {labelError && (
          <span className="text-warning pl-6 text-[10px]">{labelError}</span>
        )}
      </div>
    </TableCell>
  );
}
