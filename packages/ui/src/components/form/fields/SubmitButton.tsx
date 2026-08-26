import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button, ButtonProps } from "../../ui/button";

type SubmitButtonProps = ButtonProps & {
  isLoading?: boolean;
  label?: string;
  loadingLabel?: string;
  width?: "full" | "auto";
};

/**
 * Submit button for a `GenericForm`.
 *
 * @example
 * ```tsx
 * <SubmitButton isLoading={form.formState.isSubmitting} />
 * ```
 */
export const SubmitButton = ({
  isLoading = false,
  disabled = false,
  label = "Save Changes",
  loadingLabel = "Saving...",
  width = "full",
  className,
  ...props
}: SubmitButtonProps) => {
  return (
    <Button
      className={cn("w-full", width === "auto" && "w-auto", className)}
      type="submit"
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingLabel : label}
    </Button>
  );
};

SubmitButton.displayName = "SubmitButton";
