import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20">
            <Zap className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">TubeForge <span className="text-brand-400">Lite</span></h1>
            <p className="text-xs text-slate-500 font-mono">NO-KEY YT DOWNLOADER</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
           <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Secure
          </span>
           <span className="hidden sm:block text-slate-600">v1.0.0-lite</span>
        </div>
      </div>
    </header>
  );
};