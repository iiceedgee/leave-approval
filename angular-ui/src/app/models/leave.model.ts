import { StatusCode } from './status';

export interface Leave {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  current_status: StatusCode;
  flag_send_back: 'Y' | 'N';
  send_back_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequest {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface HistoryItem {
  id: string;
  leave_request_id: string;
  status_code: string;
  action_by: string;
  action_role: string;
  remark: string;
  created_at: string;
  action_by_name: string;
}

export interface UploadedFile {
  id: string;
  leave_request_id: string;
  original_name: string;
  file_size: number;
  size?: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface LeaveBalance {
  leave_type: string;
  quota: number;
  used: number;
  remaining: number;
}

export interface LeaveHistoryItem extends Leave {
  used_days: number;
}
