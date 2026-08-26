import { Badge } from "../ui/badge";

interface PillListProps {
  value: string[];
  variant?: "secondary" | "outline";
  emptyText: string;
}

/**
 * Pure pill/badge-list rendering, with no label row or edit-button chrome of
 * its own — that chrome differs per caller. Callers that need their own
 * header keep it; this only dedupes the "map value -> Badge" part.
 */
export default function PillList({
  value,
  variant = "secondary",
  emptyText,
}: PillListProps) {
  if (value.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((item) => (
        <Badge key={item} variant={variant} className="px-3 py-1">
          {item}
        </Badge>
      ))}
    </div>
  );
}
