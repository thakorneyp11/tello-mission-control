import { useEffect, useCallback } from 'react';
import { useDroneStore } from '@/stores/droneStore';
import { X, Play } from 'lucide-react';

interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sequenceId: string) => void;
}

export default function SequenceModal({ isOpen, onClose, onSelect }: SequenceModalProps) {
  const sequences = useDroneStore((s) => s.sequences);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[4] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="hud-panel max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="hud-label text-hud-lg">SELECT SEQUENCE</span>
          <button className="control-btn p-1" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Sequence list */}
        {sequences.length === 0 ? (
          <p className="text-hud-xs text-hud-dim italic text-center py-6">
            No sequences available
          </p>
        ) : (
          <div className="space-y-1">
            {sequences.map((seq) => (
              <button
                key={seq.id}
                className="w-full text-left py-3 px-3 rounded-lg hover:bg-surface-hover cursor-pointer transition hover:border-l-2 hover:border-l-info hover:pl-2 flex items-center gap-3"
                onClick={() => handleSelect(seq.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-hud-base font-semibold text-white">
                    {seq.name}
                  </div>
                  <div className="text-hud-xs text-hud-secondary mt-0.5">
                    {seq.description}
                  </div>
                </div>
                <Play size={16} className="text-hud-secondary hover:text-white shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
