/** 前借申請 */
export type AdvanceRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AdvanceRequest {
  id: string;
  user: string;
  amount: string;
  status: AdvanceRequestStatus;
  memo: string;
  attachment: string | null;
  /** 伝票のダウンロードURL（APIが返す） */
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export const ADVANCE_STATUS_LABELS: Record<AdvanceRequestStatus, string> = {
  Pending: '申請中',
  Approved: '承認',
  Rejected: '却下',
};
