export type DebtType = 'owe' | 'owed';
export type DebtStatus = 'pending' | 'paid';

export interface Debt {
  id: string;
  contactName: string;
  amount: number;
  type: DebtType;
  status: DebtStatus;
  dueDate?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtStats {
  totalOwedToMe: number;
  totalIOwe: number;
  netBalance: number;
}
