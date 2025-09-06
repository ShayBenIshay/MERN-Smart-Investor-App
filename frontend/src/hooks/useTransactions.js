import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook for fetching transactions with React Query
 */
export const useTransactions = (filters = {}, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["transactions", filters, page, limit],
    queryFn: () =>
      transactionsAPI.getAll(filters, page, limit).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      // Invalidate holdings to update portfolio
      queryClient.invalidateQueries(["holdings"]);
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
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["transactions"]);

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData(["transactions"]);

      // Optimistically update to remove the transaction
      queryClient.setQueryData(["transactions"], (old) =>
        old ? old.filter((transaction) => transaction._id !== deletedId) : []
      );

      // Return a context object with the snapshotted value
      return { previousTransactions };
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(["transactions"]);
      // Invalidate holdings to update portfolio
      queryClient.invalidateQueries(["holdings"]);
      refreshUser();
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["transactions"], context?.previousTransactions);
      console.error("Failed to delete transaction:", error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(["transactions"]);
      // Invalidate holdings to update portfolio
      queryClient.invalidateQueries(["holdings"]);
    },
  });
};

/**
 * Custom hook for adding multiple transactions in batch
 */
export const useBatchTransactions = () => {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: (transactions) => transactionsAPI.createBatch(transactions),
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries(["transactions"]);
      // Invalidate holdings to update portfolio
      queryClient.invalidateQueries(["holdings"]);
      // Refresh user data to update cash amount
      refreshUser();
    },
    onError: (error) => {
      console.error("Failed to add batch transactions:", error);
    },
  });
};
