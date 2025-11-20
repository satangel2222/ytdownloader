import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VideoCard } from './components/VideoCard';
import { TerminalLog } from './components/TerminalLog';
import { analyzeVideoContent } from './services/geminiService';
import { VideoMetadata, VideoQuality, LogEntry, AppState } from './types';
import { Download, Search, AlertTriangle, Loader2, Film, Server } from 'lucide-react';

// List of public Cobalt instances to try for better reliability
const COBALT_INSTANCES = [
  'https://api.cobalt.tools/api/json',
  'https://cobalt.154.53.53.53.sslip.io/api/json',
  'https://api.server.cobalt.tools/api/json', 
  'https://cobalt.q1n.net/api/json'
];

export default function App() {
  const [url, setUrl] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [quality, setQuality] = useState<VideoQuality>(VideoQuality.Q1080);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const timestamp = `${timeStr}.${ms}`;
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const extractVideoId = (inputUrl: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = inputUrl.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleAnalyze = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      addLog('Invalid YouTube URL format detected', 'error');
      return;
    }

    setAppState(AppState.ANALYZING);
    setLogs([]);
    addLog(`Connecting to Public Metadata API...`, 'info');
    addLog(`Resolving video ID: ${videoId}`, 'info');
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    addLog('Thumbnail resource located', 'success');
    addLog('Fetching video details...', 'info');

    const aiData = await analyzeVideoContent(videoId, url);
    
    setMetadata({
      id: videoId,
      url: url,
      thumbnailUrl: thumbnail,
      ...aiData
    });

    addLog('Metadata extraction complete', 'success');
    setAppState(AppState.READY);
  };

  const handleDownload = async () => {
    if (!metadata) return;

    setAppState(AppState.DOWNLOADING);
    setProgress(10);
    addLog(`[init] Initializing download sequence for ID: ${metadata.id}`, 'info');
    
    let success = false;

    // Iterate through available instances until one works
    for (const instance of COBALT_INSTANCES) {
      if (success) break;

      const instanceHostname = new URL(instance).hostname;

      try {
        addLog(`[api] Negotiating with ${instanceHostname}...`, 'warning');
        
        const response = await fetch(instance, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: metadata.url,
            vCodec: 'h264',
            vQuality: quality === VideoQuality.Q4K ? 'max' : 
                      quality === VideoQuality.Q1080 ? '1080' : 
                      quality === VideoQuality.Q720 ? '720' : '480',
            aFormat: 'mp3',
            filenamePattern: 'basic',
            isAudioOnly: quality === VideoQuality.AUDIO
          })
        });

        if (!response.ok) {
          addLog(`[api] ${instanceHostname} returned status ${response.status}. Trying next...`, 'warning');
          continue; // Try next instance
        }

        const data = await response.json();

        if (data.status === 'error' || !data.url) {
           addLog(`[api] ${instanceHostname} error: ${data.text || 'No URL returned'}`, 'warning');
           continue; // Try next instance
        }

        // If we get here, we have success
        setProgress(80);
        addLog(`[success] Stream URL resolved via ${instanceHostname}`, 'success');
        addLog(`[io] Starting transfer...`, 'info');

        // Trigger download
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        success = true;
        setProgress(100);
        addLog(`[done] File handover to browser download manager`, 'success');
        setAppState(AppState.COMPLETED);

      } catch (error: any) {
        console.warn(`Failed to connect to ${instance}:`, error);
        addLog(`[net] Connection to ${instanceHostname} failed.`, 'warning');
        // Continue to next instance
      }
    }

    if (!success) {
      addLog(`[fatal] All API instances failed. Please try again later.`, 'error');
      setAppState(AppState.ERROR);
      setProgress(0);
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setMetadata(null);
    setLogs([]);
    setUrl('');
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col pb-12">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-12 space-y-8">
        
        {/* Search Section */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="pl-4 text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                className="w-full bg-transparent border-none px-4 py-5 text-lg focus:ring-0 text-white placeholder-slate-600 font-medium"
                disabled={appState === AppState.DOWNLOADING}
              />
              <button
                onClick={handleAnalyze}
                disabled={!url || appState === AppState.ANALYZING || appState === AppState.DOWNLOADING}
                className="mr-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                {appState === AppState.ANALYZING ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking
                  </>
                ) : (
                  <>
                    Analyze
                    <Film className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {metadata && (
          <div className="space-y-6 animate-fade-in">
            <VideoCard data={metadata} />

            {/* Action Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-2">
                {Object.values(VideoQuality).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                      quality === q
                        ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {q.split(' ')[0]}
                  </button>
                ))}
              </div>
              
              <button
                onClick={appState === AppState.COMPLETED ? reset : handleDownload}
                disabled={appState === AppState.DOWNLOADING}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                  appState === AppState.COMPLETED
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : appState === AppState.ERROR 
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-white text-slate-900 hover:bg-brand-50'
                }`}
              >
                {appState === AppState.DOWNLOADING ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Fetching...
                  </>
                ) : appState === AppState.COMPLETED ? (
                  <>
                    Download Again
                  </>
                ) : appState === AppState.ERROR ? (
                  <>
                    Retry
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Start Download
                  </>
                )}
              </button>
            </div>

            {/* Terminal Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-medium text-slate-400">System Log</h3>
                {appState === AppState.DOWNLOADING && (
                  <span className="text-xs text-brand-400 animate-pulse">● Live Activity</span>
                )}
              </div>
              <TerminalLog logs={logs} />
            </div>
          </div>
        )}

        {/* Backend Status */}
        <div className="mt-12 p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
             <Server className="w-4 h-4 text-brand-500" />
             <span>Powered by Cobalt API Network</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>System Operational</span>
          </div>
        </div>

      </main>
    </div>
  );
}