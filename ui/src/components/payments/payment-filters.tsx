import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentSortOrder } from "@/types/payment";

interface PaymentFiltersProps {
  hashQuery: string;
  dateQuery: string;
  sortOrder: PaymentSortOrder;
  onHashQueryChange: (value: string) => void;
  onDateQueryChange: (value: string) => void;
  onSortOrderChange: (value: PaymentSortOrder) => void;
}

export function PaymentFilters({
  hashQuery,
  dateQuery,
  sortOrder,
  onHashQueryChange,
  onDateQueryChange,
  onSortOrderChange,
}: PaymentFiltersProps) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="hash-search">Search by hash</Label>
        <Input
          id="hash-search"
          value={hashQuery}
          onChange={(event) => onHashQueryChange(event.target.value)}
          placeholder="Transaction hash"
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-search">Search by date</Label>
        <Input
          id="date-search"
          type="date"
          value={dateQuery}
          onChange={(event) => onDateQueryChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort-order">Sort</Label>
        <Select
          value={sortOrder}
          onValueChange={(value) => onSortOrderChange(value as PaymentSortOrder)}
        >
          <SelectTrigger id="sort-order">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
