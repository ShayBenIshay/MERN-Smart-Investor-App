// User types
export interface User {
  _id: string;
  email: string;
  cash: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export interface Transaction {
  _id: string;
  operation: "buy" | "sell";
  ticker: string;
  price: number;
  papers: number;
  executedAt: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormData {
  operation: "buy" | "sell";
  ticker: string;
  price: string | number;
  papers: string | number;
  executedAt: string;
}

// Portfolio types
export interface Holding {
  ticker: string;
  totalShares: number;
  averagePrice: number;
  totalInvested: number;
  currentValue: number;
  transactions: Transaction[];
}

export interface Portfolio {
  holdings: Record<string, Holding>;
  holdingsArray: Holding[];
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Component Props types
export interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
}

export interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export interface AddTransactionFormProps {
  onTransactionAdded?: (transaction: Transaction) => void;
}
