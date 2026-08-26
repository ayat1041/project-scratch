import { cn } from "../../lib/utils";
import { Hexagon } from "lucide-react";

interface AuthLogoProps {
  className?: string;
  appName?: string;
}

export default function AuthLogo({ className, appName = "App" }: AuthLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Hexagon className="fill-secondary text-secondary h-8 w-8" />
      <span className="text-foreground text-2xl font-bold">{appName}</span>
    </div>
  );
}
