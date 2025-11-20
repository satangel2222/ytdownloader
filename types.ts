export enum VideoQuality {
  Q4K = '2160p (4K)',
  Q1080 = '1080p (HD)',
  Q720 = '720p',
  Q480 = '480p',
  AUDIO = 'Audio Only (MP3)'
}

export interface VideoMetadata {
  id: string;
  url: string;
  thumbnailUrl: string;
  title?: string;
  description?: string;
  tags?: string[];
  duration?: string;
  aiSummary?: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export enum AppState {
  IDLE,
  ANALYZING,
  READY,
  DOWNLOADING,
  COMPLETED,
  ERROR
}