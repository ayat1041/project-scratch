import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";

interface NavSigninButtonProps {
  className?: string;
  dataTestId?: string;
}

const NavSigninButton = ({ className, dataTestId }: NavSigninButtonProps) => {
  return (
    <Link
      href="/auth/signin"
      className={cn(
        "bg-primary text-primary-foreground hover:bg-secondary/80 hidden h-10 items-center justify-center rounded-full px-5 py-2 text-base font-semibold shadow-md transition-all hover:shadow-lg lg:flex",
        className,
      )}
      data-testid={dataTestId}
    >
      Sign In
    </Link>
  );
};

export default NavSigninButton;
