import { Trash2, X } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  onDelete,
  onClearSelection,
}: BulkActionsProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </span>
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Selected
        </button>
      </div>
      <button
        onClick={onClearSelection}
        className="text-blue-700 hover:text-blue-900"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
