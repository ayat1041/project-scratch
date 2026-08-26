import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface ConfirmDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  testId?: string;
  confirmButtonTestId?: string;
  cancelButtonTestId?: string;
}

/**
 * Centralized confirmation dialog for discarding unsaved changes.
 */
export const ConfirmDiscardDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = "Discard changes?",
  description = "You have unsaved changes. Do you want to keep editing or discard your changes?",
  confirmLabel = "Discard",
  cancelLabel = "Keep editing",
  testId,
  confirmButtonTestId,
  cancelButtonTestId,
}: ConfirmDiscardDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            data-testid={cancelButtonTestId}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid={confirmButtonTestId}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
