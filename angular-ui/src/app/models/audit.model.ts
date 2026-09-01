export interface AuditLog {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId: string | null;
  ip: string;
  timestamp: string;
}
