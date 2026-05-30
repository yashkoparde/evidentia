export interface Evidence {
  id: string;
  title: string;
  description: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  blockchainHash: string;
  status: 'verified' | 'tampered' | 'pending';
  aiSummary?: string;
  aiRiskScore?: number;
  aiObservations?: string[];
  thumbnail?: string;
  thumbnailType?: string;
  duration?: number;
  createdAt: string;
  lastVerified?: string;
  linkedCases?: string[];
  isDuplicate?: boolean;
  storagePath?: string;
}

export interface SystemNotification {
  id: string;
  type: 'success' | 'alert' | 'violet';
  message: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  evidenceId?: string;
  action: 'upload' | 'verify' | 'access' | 'delete' | 'system_boot';
  details: string;
  timestamp: string;
  userId: string;
  userName: string;
  status: 'success' | 'warning' | 'alert';
  aiSummary?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'admin' | 'forensic_expert';
  lastSeen: string;
}
