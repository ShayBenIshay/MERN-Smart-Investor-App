import { useMemo, useEffect, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsAPI, portfolioAPI } from "../services/api";

// Check if holdings are valid (have lastSyncedAt)
const areHoldingsValid = (holdings) => {
  if (!holdings || holdings.length === 0) return false;
  return holdings.every((holding) => holding.lastSyncedAt);
};

// Calculate portfolio from transactions (for syncing)
const calculatePortfolio = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      holdings: [],
      totalSpent: 0,
      totalValue: 0,
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
    };
  }

  // Group transactions by ticker
  const holdingsMap = {};

  // Sort transactions by date to ensure FIFO processing
  transactions.sort((a, b) => new Date(a.executedAt) - new Date(b.executedAt));

  transactions.forEach((transaction) => {
    const { ticker, operation, papers, price } = transaction;

    // Convert price to number safely (handles Decimal128)
    const numericPrice =
      typeof price === "number"
        ? price
        : price?.$numberDecimal
        ? parseFloat(price.$numberDecimal)
        : parseFloat(price) || 0;
    const numericPapers = parseInt(papers) || 0;

    if (!holdingsMap[ticker]) {
      holdingsMap[ticker] = {
        symbol: ticker,
        totalShares: 0,
        totalSpent: 0,
        transactions: [],
        buyLots: [],
      };
    }

    const holding = holdingsMap[ticker];
    holding.transactions.push(transaction);

    // FIFO accounting - track individual buy lots
    if (operation === "buy") {
      holding.buyLots.push({
        shares: numericPapers,
        pricePerShare: numericPrice,
        date: transaction.executedAt,
      });
      holding.totalShares += numericPapers;
      holding.totalSpent += numericPapers * numericPrice;
    } else if (operation === "sell") {
      let sharesToSell = numericPapers;
      let costBasisOfSoldShares = 0;

      // Sell from oldest lots first (FIFO)
      while (sharesToSell > 0 && holding.buyLots.length > 0) {
        const oldestLot = holding.buyLots[0];

        if (oldestLot.shares <= sharesToSell) {
          // Sell entire lot
          sharesToSell -= oldestLot.shares;
          costBasisOfSoldShares += oldestLot.shares * oldestLot.pricePerShare;
          holding.buyLots.shift(); // Remove entire lot
        } else {
          // Partially sell from this lot
          costBasisOfSoldShares += sharesToSell * oldestLot.pricePerShare;
          oldestLot.shares -= sharesToSell;
          sharesToSell = 0;
        }
      }

      holding.totalShares -= numericPapers;
      holding.totalSpent -= costBasisOfSoldShares;
    }
  });

  // Calculate basic metrics for each holding
  const basicHoldings = Object.values(holdingsMap)
    .filter((holding) => holding.totalShares > 0)
    .map((holding) => {
      // Safe division with fallbacks to prevent NaN
      const avgBuyPrice =
        holding.totalShares > 0 ? holding.totalSpent / holding.totalShares : 0;

      // Use real price from holdings database (updated via WebSocket)
      // For syncing, we'll use a placeholder that will be updated by the real-time system
      const lastPrice = 0; // This will be updated by the WebSocket price updates

      const totalValue = holding.totalShares * lastPrice;
      const unrealizedPL = totalValue - holding.totalSpent;

      // Safe percentage calculation to prevent NaN
      const unrealizedPLPercent =
        holding.totalSpent > 0 ? (unrealizedPL / holding.totalSpent) * 100 : 0;

      return {
        symbol: holding.symbol,
        totalShares: holding.totalShares,
        averagePrice: avgBuyPrice,
        totalSpent: holding.totalSpent,
        totalValue,
        lastPrice,
        unrealizedPL,
        unrealizedPLPercent,
      };
    });

  // Calculate portfolio totals
  const totalSpent = basicHoldings.reduce((sum, h) => sum + h.totalSpent, 0);
  const totalValue = basicHoldings.reduce((sum, h) => sum + h.totalValue, 0);
  const unrealizedPL = totalValue - totalSpent;
  const unrealizedPLPercent =
    totalSpent > 0 ? (unrealizedPL / totalSpent) * 100 : 0;

  return {
    holdings: basicHoldings,
    totalSpent,
    totalValue,
    unrealizedPL,
    unrealizedPLPercent,
  };
};

export const usePortfolio = (userId) => {
  console.log("usePortfolio hook called with userId:", userId);

  // State for sync status and loading strategy
  const [isSyncing, setIsSyncing] = useState(false);
  const [shouldFetchTransactions, setShouldFetchTransactions] = useState(true);

  // Get holdings data first (priority)
  const {
    data: holdingsData,
    isLoading: holdingsLoading,
    error: holdingsError,
    refetch: refetchHoldings,
  } = useQuery({
    queryKey: ["portfolio", userId],
    queryFn: () => {
      if (!userId) {
        console.error("Cannot fetch portfolio: userId is undefined");
        throw new Error("User ID is required");
      }
      console.log("Fetching portfolio for userId:", userId);
      return portfolioAPI.getPortfolio(userId).then((res) => {
        console.log("Portfolio data fetched:", res.data.data);
        return res.data.data;
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!userId, // Only fetch when user is available
  });

  // Conditionally fetch transactions only when needed
  const {
    data: transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery({
    queryKey: ["transactions", "all"],
    queryFn: () =>
      transactionsAPI.getAllWithoutPagination().then((res) => {
        console.log(
          "Portfolio transactions fetched:",
          res.data.data?.length || 0,
          "transactions"
        );
        return res.data.data;
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: shouldFetchTransactions, // Only fetch when needed
  });

  // Sync holdings with calculated portfolio data
  const syncHoldings = useCallback(
    async (transactionsData) => {
      if (!transactionsData || transactionsData.length === 0) return;
      if (!userId) {
        console.error("Cannot sync portfolio: userId is undefined");
        return;
      }

      setIsSyncing(true);
      try {
        const calculatedPortfolio = calculatePortfolio(transactionsData);

        // Fetch real-time prices for all symbols
        const symbols = calculatedPortfolio.holdings.map((h) => h.symbol);
        const pricePromises = symbols.map((symbol) =>
          transactionsAPI
            .getPrice(symbol)
            .catch(() => ({ data: { data: { price: 0 } } }))
        );
        const priceResponses = await Promise.all(pricePromises);
        const priceMap = {};
        priceResponses.forEach((response, index) => {
          priceMap[symbols[index]] = response.data.data.price || 0;
        });

        const holdingsToSync = calculatedPortfolio.holdings.map((holding) => ({
          symbol: holding.symbol,
          totalShares: holding.totalShares,
          averagePrice: holding.averagePrice,
          totalSpent: holding.totalSpent,
          totalValue: holding.totalShares * (priceMap[holding.symbol] || 0),
          lastPrice: priceMap[holding.symbol] || 0,
        }));

        console.log("Syncing portfolio:", holdingsToSync);
        await portfolioAPI.syncPortfolio(userId, holdingsToSync);
        refetchHoldings();
      } catch (error) {
        console.error("Error syncing holdings:", error);
      } finally {
        setIsSyncing(false);
      }
    },
    [refetchHoldings, userId]
  );

  // Smart loading strategy
  useEffect(() => {
    if (holdingsData) {
      const holdingsValid = areHoldingsValid(holdingsData);
      console.log("Holdings valid:", holdingsValid);

      if (holdingsValid) {
        // Holdings are valid, skip transaction fetching
        console.log("Holdings are valid, skipping transaction fetch");
        setShouldFetchTransactions(false);
      } else {
        // Holdings are invalid, fetch transactions
        console.log("Holdings are invalid, fetching transactions");
        setShouldFetchTransactions(true);
      }
    }
  }, [holdingsData]);

  // Auto-sync when transactions are loaded
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const symbols = [...new Set(transactions.map((t) => t.ticker))];
      if (symbols.length > 0) {
        // Subscribe to portfolio symbols
        transactionsAPI.subscribeToPortfolio(symbols);
      }

      // Always sync when transactions are loaded (they were fetched because holdings were invalid)
      console.log("Transactions loaded, syncing holdings");
      syncHoldings(transactions);
    }
  }, [transactions, syncHoldings]);

  // Calculate portfolio from holdings data directly
  const portfolioData = useMemo(() => {
    if (!holdingsData || holdingsData.length === 0) {
      console.log("Portfolio calculation: No holdings data");
      return {
        holdings: [],
        totalSpent: 0,
        totalValue: 0,
        unrealizedPL: 0,
        unrealizedPLPercent: 0,
      };
    }

    console.log(
      "Portfolio calculation: Processing",
      holdingsData.length,
      "holdings"
    );

    // Calculate additional metrics for each holding
    const portfolioHoldings = holdingsData.map((holding) => {
      const unrealizedPL = holding.totalValue - holding.totalSpent;
      const unrealizedPLPercent =
        holding.totalSpent > 0 ? (unrealizedPL / holding.totalSpent) * 100 : 0;

      // Risk $ = (totalValue - stopLoss * totalShares) if stopLoss > 0
      const riskDollar =
        holding.stopLoss > 0 && holding.totalShares > 0
          ? Math.max(
              0,
              holding.totalValue - holding.stopLoss * holding.totalShares
            )
          : 0;

      return {
        symbol: holding.ticker,
        avgBuyPrice: holding.averagePrice,
        position: holding.totalShares,
        lastPrice: holding.lastPrice,
        totalSpent: holding.totalSpent,
        totalValue: holding.totalValue,
        unrealizedPL,
        unrealizedPLPercent,
        stopLoss: holding.stopLoss,
        entryReason: holding.entryReason,
        riskDollar,
        riskPercent: 0, // Will be calculated after we have total portfolio value
        totalPercent: 0, // Will be calculated after we have total portfolio value
      };
    });

    // Calculate portfolio totals
    const totalSpent = portfolioHoldings.reduce(
      (sum, h) => sum + h.totalSpent,
      0
    );
    const totalValue = portfolioHoldings.reduce(
      (sum, h) => sum + h.totalValue,
      0
    );
    const unrealizedPL = totalValue - totalSpent;
    const unrealizedPLPercent =
      totalSpent > 0 ? (unrealizedPL / totalSpent) * 100 : 0;

    // Calculate risk and portfolio percentages
    const finalHoldings = portfolioHoldings.map((holding) => ({
      ...holding,
      riskPercent: totalValue > 0 ? (holding.riskDollar / totalValue) * 100 : 0,
      totalPercent:
        totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0,
    }));

    console.log(
      "Portfolio calculation result:",
      finalHoldings.length,
      "holdings"
    );
    return {
      holdings: finalHoldings,
      totalSpent,
      totalValue,
      unrealizedPL,
      unrealizedPLPercent,
    };
  }, [holdingsData]);

  return {
    ...portfolioData,
    isLoading: transactionsLoading || holdingsLoading || isSyncing,
    error: transactionsError || holdingsError,
    isSyncing,
  };
};

// Mock data function removed - now using real-time prices from WebSocket
