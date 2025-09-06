import { useState, useEffect, useRef } from "react";
import { transactionsAPI } from "../services/api";

// Custom hook for debounced price fetching
export const useDebouncedPrice = (symbol, delay = 500) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset state if symbol is too short
    if (!symbol || symbol.length < 2) {
      setPrice(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Set loading state
    setLoading(true);
    setError(null);

    // Create new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await transactionsAPI.getPrice(symbol.toUpperCase());
        setPrice(response.data.data.price);
        setError(null);
      } catch (err) {
        setPrice(null);
        setError("Symbol not found");
      } finally {
        setLoading(false);
      }
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [symbol, delay]);

  return { price, loading, error };
};
