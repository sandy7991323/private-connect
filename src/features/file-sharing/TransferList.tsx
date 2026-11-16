import React from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { useFileStore } from '../../store/useFileStore';
import { TransferItemCard } from './TransferItemCard';
import { Button } from '../../components/ui/Button';

export const TransferList: React.FC = () => {
  const { transfers, clearCompleted } = useFileStore();
  const items = Object.values(transfers).sort((a, b) => b.timestamp - a.timestamp);

  const hasFinished = items.some(
    (item) =>
      item.status === 'completed' ||
      item.status === 'rejected' ||
      item.status === 'cancelled' ||
      item.status === 'error'
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-slate-800/80 rounded-xl bg-slate-900/20">
        <Layers className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <p className="text-sm font-medium text-slate-400">No file transfers yet</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Select or drag a file to offer a direct P2P transfer
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Transfers ({items.length})
          </h3>
        </div>
        {hasFinished && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearCompleted}
            icon={<Trash2 className="w-3.5 h-3.5 text-slate-400" />}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Clear Finished
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {items.map((item) => (
          <TransferItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
