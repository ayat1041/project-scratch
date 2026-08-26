import React from "react";

interface TableTitleProps {
  title: string;
  description: string;
  titleTestId?: string;
  descriptionTestId?: string;
}

export default function TableTitle({
  title,
  description,
  titleTestId,
  descriptionTestId,
}: TableTitleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1
          className="text-2xl font-bold text-[#1e1e1e]"
          data-testid={titleTestId}
        >
          {title}
        </h1>
        <p className="mt-1 text-[#6b7280]" data-testid={descriptionTestId}>
          {description}
        </p>
      </div>
    </div>
  );
}
