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
  _id: string;
  ticker: string;
  stopLoss: number;
  entryReason: string;
  // Calculated fields
  totalShares: number;
  averagePrice: number;
  totalSpent: number;
  totalValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  riskDollar: number;
  riskPercent: number;
  totalPercent: number;
  lastPrice: number;
  position: number;
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
