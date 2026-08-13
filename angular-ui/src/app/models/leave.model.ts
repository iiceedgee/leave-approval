export interface Leave {
  id: number;
  user_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  current_status: 'F' | 'P' | 'T' | 'M' | 'S' | 'B' | 'C' | 'U';
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
  id: number;
  leave_request_id: number;
  status_code: string;
  action_by: number;
  action_role: string;
  remark: string;
  created_at: string;
  action_by_name: string;
}

export interface UploadedFile {
  id: number;
  leave_request_id: number;
  original_name: string;
  file_size: number;
  size?: number;
  mime_type: string;
  uploaded_by: number;
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
