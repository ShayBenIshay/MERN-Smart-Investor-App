import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook for fetching transactions with React Query
 */
export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsAPI.getAll().then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Custom hook for adding a new transaction
 */
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: (transactionData) => transactionsAPI.create(transactionData),
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries(["transactions"]);
      // Refresh user data to update cash amount
      refreshUser();
    },
    onError: (error) => {
      console.error("Failed to add transaction:", error);
    },
  });
};

/**
 * Custom hook for updating a transaction
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => transactionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["transactions"]);
    },
    onError: (error) => {
      console.error("Failed to update transaction:", error);
    },
  });
};

/**
 * Custom hook for deleting a transaction
 */
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: (id) => transactionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["transactions"]);
      refreshUser();
    },
    onError: (error) => {
      console.error("Failed to delete transaction:", error);
    },
  });
};
