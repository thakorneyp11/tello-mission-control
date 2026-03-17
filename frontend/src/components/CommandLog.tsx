import { useEffect, useRef, useCallback } from 'react';
import { useDroneStore } from '@/stores/droneStore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CommandLogEntry } from '@/types/drone';

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function LogEntry({ entry }: { entry: CommandLogEntry }) {
  const dotColor = entry.result === 'ok' ? 'bg-ok' : 'bg-danger';

  return (
    <div className="animate-log-slide py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-hud-xs font-mono text-hud-dim shrink-0">
          {formatTimestamp(entry.timestamp)}
        </span>
        <span className="text-hud-xs font-mono text-white uppercase truncate">
          {entry.command}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      </div>
    </div>
  );
}

export default function CommandLog() {
  const commandLog = useDroneStore((s) => s.commandLog);
  const collapsed = useDroneStore((s) => s.commandLogCollapsed);
  const toggleCommandLog = useDroneStore((s) => s.toggleCommandLog);

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    shouldAutoScroll.current = atBottom;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldAutoScroll.current) return;
    el.scrollTop = el.scrollHeight;
  }, [commandLog]);

  const visibleEntries = collapsed ? commandLog.slice(-1) : commandLog;

  const isEmpty = commandLog.length === 0;

  return (
    <div className={`hud-panel animate-fade-in-up w-[260px] ${isEmpty ? 'pb-3' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="hud-label">Command Log</span>
          {!isEmpty && (
            <span className="text-[10px] font-mono text-hud-dim bg-white/[0.06] px-1.5 py-0.5 rounded">
              {commandLog.length}
            </span>
          )}
        </div>
        {!isEmpty && (
          <button className="control-btn p-1" onClick={toggleCommandLog} aria-label="Toggle command log">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        )}
      </div>

      {/* Entries */}
      {isEmpty ? (
        <p className="text-hud-xs text-hud-dim text-center mt-2">
          No commands yet
        </p>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={
            collapsed
              ? 'mt-2'
              : 'mt-2 max-h-[150px] overflow-y-auto'
          }
        >
          {visibleEntries.map((entry, i) => (
            <LogEntry key={`${entry.timestamp}-${i}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
