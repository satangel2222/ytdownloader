import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] shadow-2xl font-mono text-xs md:text-sm">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
        </div>
        <span className="ml-2 text-slate-500">yt-dlp --process --verbose</span>
      </div>
      <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-1 text-slate-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Waiting for input stream...</div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="flex gap-3 break-all">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-emerald-400' :
              log.type === 'warning' ? 'text-amber-400' :
              'text-slate-300'
            }>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};