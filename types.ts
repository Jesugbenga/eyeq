
export enum EventType {
  WEBINAR = 'Webinar/Presentation',
  SPORTS = 'Sports',
  CONFERENCE = 'Conference',
  EMERGENCY = 'Emergency',
  GENERAL = 'General',
}

export enum DetailLevel {
  MINIMAL = 'Minimal',
  STANDARD = 'Standard',
  DETAILED = 'Detailed',
}

export interface TranscriptItem {
  type: 'transcript' | 'description' | 'error';
  text: string;
}

export enum Status {
    IDLE = 'Idle',
    LISTENING = 'Listening',
    ANALYZING = 'Analyzing',
    SPEAKING = 'Speaking Description',
    ERROR = 'Error',
}
