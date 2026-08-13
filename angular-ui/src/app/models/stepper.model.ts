export interface StepperStep {
  seq: number;
  icon: string;
  name: string;
  statusCode: string;
  state: 'current' | 'done' | 'pending' | 'cancelled' | 'rejected';
}

export interface TimelineItem {
  state: 'current' | 'done' | 'pending';
  name: string;
  actionBy: string;
  actionRole: string;
  time: string;
}
