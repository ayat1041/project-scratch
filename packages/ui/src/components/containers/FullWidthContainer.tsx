import React, { ElementType } from "react";
import { twMerge } from "tailwind-merge";

interface FullWidthContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}

const FullWidthContainer = ({
  children,
  className,
  as: Component = "div",
}: FullWidthContainerProps) => {
  return (
    <Component className={twMerge("w-full", className)}>{children}</Component>
  );
};

export default FullWidthContainer;
