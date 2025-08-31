import { QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Enhanced query client with better error handling and defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnReconnect: true, // Refetch when internet reconnects
    },
    mutations: {
      onError: (error: any) => {
        // Global error handling for mutations
        const message =
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong. Please try again.";

        toast.error(message);
      },
      onSuccess: () => {
        // Optional: Show success toast for all mutations
        // toast.success('Action completed successfully!');
      },
    },
  },
});

// Utility function to handle query errors
export const handleQueryError = (error: any) => {
  console.error("Query Error:", error);

  const message =
    error?.response?.data?.error ||
    error?.message ||
    "Failed to load data. Please try again.";

  toast.error(message);
};

// Prefetch utility for common queries
export const prefetchTransactions = () => {
  queryClient.prefetchQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      import("../services/api").then((api) => api.transactionsAPI.getAll()),
    staleTime: 5 * 60 * 1000,
  });
};
