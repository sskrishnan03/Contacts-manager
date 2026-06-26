export type Page = 'dashboard' | 'contacts' | 'settings';

export type Theme = 'light' | 'dark';

export interface DisplaySettings {
  showProfilePictures: boolean;
  showContactNumber: boolean;
  showOnlyWithNumbers: boolean;
}

export interface LabeledEntry {
  label: string;
  value: string;
}

export type ActivityType = 'call' | 'message' | 'email' | 'whatsapp' | 'video_call';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO string
  notes?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface Contact {
  id:string;
  firstName: string;
  lastName: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phones: LabeledEntry[];
  emails: LabeledEntry[];
  website?: string;
  address?: Address;
  company?: string;
  jobTitle?: string;
  notes?: string;
  birthday?: string; // YYYY-MM-DD
  reminderSetting?: 'none' | '1_day' | '3_days' | '7_days';
  isFavorite: boolean;
  profilePicture?: string; // base64 string
  group?: 'Family' | 'Friends' | 'Work' | 'Other' | '';
  tags: string[];
  socialMediaLinks?: LabeledEntry[];
  createdAt: string; // ISO string
  isArchived?: boolean;
  isBlocked?: boolean;
  isPrivate?: boolean;
  deletedAt?: string; // ISO string for trash timestamp
  activityLog?: ActivityLog[];
  linkedContactIds?: string[];
}

export interface ChatMessage {
  role: 'user' | 'model' | 'error';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string; // ISO string
  messages: ChatMessage[];
}

export interface BackupData {
  version: 1;
  contacts: Contact[];
  calendarEvents: CalendarEvent[];
  theme: Theme;
  displaySettings: DisplaySettings;
  chatSessions: ChatSession[];
}

// --- New Calendar Types ---

export type EventType = 'Event' | 'Birthday' | 'Anniversary' | 'Countdown' | 'Other';
export type EventRepeat = 'Do not repeat' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
export type EventReminder = 'No reminder' | 'At time of event' | '5 minutes before' | '15 minutes before' | '1 hour before' | '1 day before' | '2 days before';
export type AlertMode = 'Notification reminder' | 'Alarm';

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  contactId?: string; 
  date: string; // YYYY-MM-DD for all-day, or start date
  endDate?: string; // YYYY-MM-DD for multi-day events
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  isAllDay: boolean;
  location?: string;
  notes?: string;
  repeat: EventRepeat;
  reminder: EventReminder;
  alertMode: AlertMode;
  createdAt: string; // ISO string
}