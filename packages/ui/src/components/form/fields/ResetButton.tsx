import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";

type ResetButtonProps = {
  onReset: () => void;
  resetLabel?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Reset button for a `GenericForm` — pairs with `GenericFormRef.reset()`.
 *
 * @example
 * ```tsx
 * <ResetButton onReset={() => formRef.current?.reset()} />
 * ```
 */
export const ResetButton = ({
  onReset,
  resetLabel = "Reset",
  disabled = false,
  className,
}: ResetButtonProps) => {
  return (
    <div className={cn(className)}>
      <Button
        type="reset"
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={disabled}
      >
        {resetLabel}
      </Button>
    </div>
  );
};

ResetButton.displayName = "ResetButton";
