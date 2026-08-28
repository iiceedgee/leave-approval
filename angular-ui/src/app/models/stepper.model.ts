export interface StepperStep {
  seq: number;
  icon: string;
  name: string;
  statusCode: string;
  state: 'current' | 'done' | 'pending' | 'cancelled' | 'rejected';
}

export interface TimelineItem {
  // rejected/cancelled ONLY on terminal RJ/CX (polymorphic final) — synced with backend buildHistoryTimeline
  state: 'current' | 'done' | 'pending' | 'cancelled' | 'rejected';
  name: string;
  actionBy: string;
  actionRole: string;
  time: string;
}
