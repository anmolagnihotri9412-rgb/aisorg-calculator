
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface VoiceCommandResult {
  expression: string;
  original: string;
  explanation?: string;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}
