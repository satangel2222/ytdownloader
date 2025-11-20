import React, { useState } from 'react';
import { Header } from './components/Header';
import { VideoCard } from './components/VideoCard';
import { TerminalLog } from './components/TerminalLog';
import { analyzeVideoContent } from './services/geminiService';
import { VideoMetadata, VideoQuality, LogEntry, AppState } from './types';
import { Download, Search, Loader2, Film, Server, AlertCircle, Terminal, Copy, Check, CloudLightning, Shield, Laptop, Settings, Network } from 'lucide-react';

// Expanded list of public Cobalt instances
const COBALT_INSTANCES = [
  'https://api.download.ax/api/json',
  'https://cobalt.j22.dev/api/json',
  'https://api.cobalt.tools/api/json',
  'https://cobalt.kwiatekmiki.pl/api/json',
  'https://cobalt.xy24.eu/api/json',
  'https://cobalt.kanzen.click/api/json',
  'https://cobalt.synn.cc/api/json',
  'https://cobalt.typings.dev/api/json',
  'https://cobalt.smartcode.rs/api/json',
  'https://cobalt.154.53.53.53.sslip.io/api/json',
  'https://cobalt.q1n.net/api/json',
  'https://api.server.cobalt.tools/api/json',
  'https://dl.khub.ky/api/json',
  'https://cobalt.arms.nu/api/json',
  'https://cobalt.ethan.link/api/json',
  'https://cobalt.my.to/api/json'
];

type DownloadMode = 'swarm' | 'bridge' | 'cli';

export default function App() {
  const [url, setUrl] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [quality, setQuality] = useState<VideoQuality>(VideoQuality.Q1080);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Settings
  const [downloadMode, setDownloadMode] = useState<DownloadMode>('swarm');
  // Default to localhost for the bridge
  const [bridgeUrl, setBridgeUrl] = useState('http://localhost:3000/download');
  const [showSettings, setShowSettings] = useState(false);

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

  const generateYtDlpCommand = () => {
    if (!metadata) return '';
    
    let args = '';
    switch (quality) {
      case VideoQuality.Q4K:
        args = '-f "bv*[height<=2160]+ba/b" --merge-output-format mp4';
        break;
      case VideoQuality.Q1080:
        args = '-f "bv*[height<=1080]+ba/b" --merge-output-format mp4';
        break;
      case VideoQuality.Q720:
        args = '-f "bv*[height<=720]+ba/b" --merge-output-format mp4';
        break;
      case VideoQuality.Q480:
        args = '-f "bv*[height<=480]+ba/b" --merge-output-format mp4';
        break;
      case VideoQuality.AUDIO:
        args = '-x --audio-format mp3 --audio-quality 0';
        break;
    }

    return `yt-dlp ${args} "${metadata.url}"`;
  };

  const handleCopyCommand = () => {
    const cmd = generateYtDlpCommand();
    if (cmd) {
      navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCliGeneration = async () => {
    if (!metadata) return;
    
    setLogs([]);
    addLog('[sys] Swarm network bypassed.', 'warning');
    addLog('[sys] Native CLI Mode engaged.', 'info');
    addLog(`[cfg] Target Quality: ${quality}`, 'info');
    addLog('[cli] Generating optimized arguments...', 'info');
    
    await new Promise(r => setTimeout(r, 600));
    
    addLog('[cli] Command construction complete.', 'success');
    setAppState(AppState.CLI_FALLBACK);
  };

  const handleBridgeDownload = async () => {
    if (!metadata) return;

    setAppState(AppState.DOWNLOADING);
    setProgress(20);
    setLogs([]);
    addLog(`[init] Engaging Server Bridge Protocol...`, 'info');
    addLog(`[cfg] Target Endpoint: ${bridgeUrl}`, 'info');

    try {
        addLog(`[net] Establishing secure tunnel to backend...`, 'warning');
        
        const controller = new AbortController();
        // Longer timeout for server processing
        const timeoutId = setTimeout(() => controller.abort(), 300000); 

        try {
            const response = await fetch(bridgeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: metadata.url,
                    quality: quality
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error: ${response.status} - ${errorText}`);
            }
            
            addLog(`[success] Stream acquired from bridge.`, 'success');
            addLog(`[io] Downloading data...`, 'info');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            // Try to get filename from headers if available, else fallback
            const disposition = response.headers.get('Content-Disposition');
            let filename = `video-${metadata.id}.mp4`;
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                  filename = matches[1].replace(/['"]/g, '');
                }
            }
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setAppState(AppState.COMPLETED);
            setProgress(100);

        } catch (networkError: any) {
             clearTimeout(timeoutId);
             throw new Error(networkError.message || 'Connection failed');
        }

    } catch (error: any) {
        addLog(`[fatal] Bridge connection failed: ${error.message}`, 'error');
        addLog(`[help] 1. Ensure 'node server.js' is running on your computer.`, 'warning');
        addLog(`[help] 2. Ensure Bridge URL is set to http://localhost:3000/download`, 'info');
        setAppState(AppState.ERROR);
    }
  };

  const handleSwarmDownload = async () => {
    if (!metadata) return;

    setAppState(AppState.DOWNLOADING);
    setProgress(10);
    setLogs([]); // Clear logs for fresh run
    addLog(`[init] Initializing download sequence for ID: ${metadata.id}`, 'info');
    addLog(`[cfg] Target Quality: ${quality}`, 'info');
    
    let success = false;
    const shuffledInstances = [...COBALT_INSTANCES].sort(() => 0.5 - Math.random());

    addLog(`[net] Resolved ${shuffledInstances.length} candidate nodes.`, 'info');

    const tryFetch = async (instanceUrl: string, useSafeMode: boolean) => {
        const requestBody = {
            url: metadata.url,
            vQuality: useSafeMode ? '720' : (quality === VideoQuality.Q4K ? 'max' : 
                      quality === VideoQuality.Q1080 ? '1080' : 
                      quality === VideoQuality.Q720 ? '720' : '480'),
            aFormat: 'mp3',
            filenameStyle: 'basic',
            isAudioOnly: quality === VideoQuality.AUDIO,
            disableMetadata: useSafeMode
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Shortened timeout

        try {
            const response = await fetch(instanceUrl, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    };

    for (const instance of shuffledInstances) {
      if (success) break;
      let instanceHostname = new URL(instance).hostname;

      try {
        addLog(`[api] Negotiating with ${instanceHostname}...`, 'warning');
        let response = await tryFetch(instance, false);
        
        if (!response.ok) continue; 

        const data = await response.json();
        if (data.status === 'error' || (!data.url && !data.pickle)) continue; 

        const downloadUrl = data.url || data.pickle;
        if (!downloadUrl) continue;

        setProgress(80);
        addLog(`[success] Tunnel established via ${instanceHostname}`, 'success');
        addLog(`[io] Starting transfer...`, 'info');

        const link = document.createElement('a');
        link.href = downloadUrl;
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
        continue;
      }
    }

    if (!success) {
      addLog(`[fatal] All cloud nodes exhausted.`, 'error');
      addLog(`[tip] Try switching to 'Server Bridge' or 'Native CLI' mode.`, 'info');
      setAppState(AppState.ERROR);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (downloadMode === 'cli') {
        handleCliGeneration();
    } else if (downloadMode === 'bridge') {
        handleBridgeDownload();
    } else {
        handleSwarmDownload();
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setMetadata(null);
    setLogs([]);
    setUrl('');
    setProgress(0);
    // Keep downloadMode persistent
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
            {appState !== AppState.CLI_FALLBACK ? (
            <div className="space-y-4">
              
              {/* Controls Row */}
              <div className="flex flex-col gap-4">
                  
                  <div className="flex gap-4 flex-col md:flex-row">
                      {/* Quality Selector */}
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {Object.values(VideoQuality).map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                              quality === q
                                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                          >
                            {q.split(' ')[0]}
                          </button>
                        ))}
                      </div>

                      {/* Settings Toggle */}
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-3 rounded-xl border transition-colors ${showSettings ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <Settings className="w-6 h-6" />
                      </button>
                  </div>

                  {/* Mode Selector & Settings */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      <div className="p-2 flex items-center gap-2">
                          <button
                            onClick={() => setDownloadMode('swarm')}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                              downloadMode === 'swarm'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                          >
                            <CloudLightning className="w-4 h-4" />
                            Swarm
                          </button>
                          <button
                            onClick={() => setDownloadMode('bridge')}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                              downloadMode === 'bridge'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                          >
                            <Network className="w-4 h-4" />
                            Server Bridge
                          </button>
                          <button
                            onClick={() => setDownloadMode('cli')}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                              downloadMode === 'cli'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                          >
                            <Laptop className="w-4 h-4" />
                            Native CLI
                          </button>
                      </div>

                      {/* Extended Settings Panel */}
                      {(showSettings || downloadMode === 'bridge') && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-800 animate-fade-in">
                            {downloadMode === 'bridge' && (
                                <div className="space-y-2">
                                    <label className="text-xs text-amber-400 font-medium uppercase tracking-wider flex items-center gap-2">
                                        <Server className="w-3 h-3" /> Backend Endpoint
                                    </label>
                                    <input 
                                        type="text" 
                                        value={bridgeUrl}
                                        onChange={(e) => setBridgeUrl(e.target.value)}
                                        className="w-full bg-black/30 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-amber-500 focus:outline-none font-mono"
                                        placeholder="http://localhost:3000/download"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Must be running locally: <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">node server.js</code>
                                    </p>
                                </div>
                            )}
                            {downloadMode === 'swarm' && (
                                <p className="text-xs text-slate-500">
                                    Swarm mode uses public community APIs. Availability is not guaranteed.
                                </p>
                            )}
                             {downloadMode === 'cli' && (
                                <p className="text-xs text-slate-500">
                                    CLI mode generates commands for you to run in your local terminal.
                                </p>
                            )}
                        </div>
                      )}
                  </div>
              </div>

              <div className="flex gap-4">
                  <button
                    onClick={appState === AppState.COMPLETED ? reset : handleDownload}
                    disabled={appState === AppState.DOWNLOADING}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                      appState === AppState.COMPLETED
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : appState === AppState.ERROR 
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : downloadMode === 'cli' 
                             ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                             : downloadMode === 'bridge'
                               ? 'bg-amber-600 hover:bg-amber-500 text-white'
                               : 'bg-white text-slate-900 hover:bg-brand-50'
                    }`}
                  >
                    {appState === AppState.DOWNLOADING ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        {downloadMode === 'cli' ? 'Generating...' : downloadMode === 'bridge' ? 'Streaming...' : 'Fetching...'}
                      </>
                    ) : appState === AppState.COMPLETED ? (
                      <>
                        Download Again
                      </>
                    ) : appState === AppState.ERROR ? (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        Retry
                      </>
                    ) : (
                      <>
                        {downloadMode === 'cli' ? <Terminal className="w-6 h-6" /> : downloadMode === 'bridge' ? <Network className="w-6 h-6" /> : <Download className="w-6 h-6" />}
                        {downloadMode === 'cli' ? 'Generate Command' : downloadMode === 'bridge' ? 'Connect & Download' : 'Start Download'}
                      </>
                    )}
                  </button>
              </div>
            </div>
            ) : (
              /* CLI / Native View */
              <div className="bg-slate-900 border border-emerald-900/50 rounded-xl p-6 animate-fade-in space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-900/20 rounded-lg">
                     <Terminal className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-100">Native Command Ready</h3>
                    <p className="text-sm text-emerald-400/80">
                      Direct execution bypasses all API limits and server errors.
                    </p>
                  </div>
                </div>

                {/* Command Box */}
                <div className="space-y-3">
                    <div className="bg-black/80 rounded-lg p-4 border border-slate-700 font-mono text-sm relative group shadow-inner">
                        <div className="text-slate-300 break-all pr-10 selection:bg-emerald-500/30">
                            <span className="text-emerald-400 font-bold">yt-dlp</span> {generateYtDlpCommand().replace('yt-dlp ', '')}
                        </div>
                        <button 
                            onClick={handleCopyCommand}
                            className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-600"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                
                {/* Info/Tip */}
                <div className="bg-slate-800/50 rounded-lg p-4 text-xs text-slate-400 flex gap-3 border border-slate-800/50">
                    <Shield className="w-10 h-10 text-slate-600 shrink-0" />
                    <div className="space-y-1">
                        <p className="font-semibold text-slate-300">Why do I need to run this?</p>
                        <p>
                            Web browsers are sandboxed for security and cannot directly execute software like <strong>yt-dlp</strong> on your machine. 
                            This generated command allows you to run the download securely on your own computer, bypassing all web-based API failures.
                        </p>
                    </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-emerald-500/50 font-mono">MODE: LOCAL_EXECUTION</span>
                    <button onClick={() => setAppState(AppState.READY)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      Return to Dashboard
                    </button>
                </div>
              </div>
            )}

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
             <Server className="w-4 h-4 text-slate-600" />
             <span>
               {downloadMode === 'cli' ? 'Local Environment (Native)' : downloadMode === 'bridge' ? 'Custom Server (Bridge)' : 'Cobalt Swarm (Cloud API)'}
             </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${appState === AppState.CLI_FALLBACK ? 'bg-emerald-500' : appState === AppState.ERROR ? 'bg-red-500' : 'bg-brand-500'} animate-pulse`}></div>
            <span>{appState === AppState.CLI_FALLBACK ? 'Terminal Active' : appState === AppState.ERROR ? 'System Halt' : 'Online'}</span>
          </div>
        </div>

      </main>
    </div>
  );
}