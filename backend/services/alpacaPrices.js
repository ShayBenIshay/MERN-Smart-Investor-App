const WebSocket = require("ws");
const axios = require("axios");
const config = require("../config/config");

class AlpacaPrices {
  constructor() {
    this.ws = null;
    this.prices = new Map();
    this.subscribedSymbols = new Set();
    this.isAuthenticated = false;
    this.config = config[process.env.NODE_ENV || "development"];
  }

  connect() {
    if (!this.config.alpaca.apiKey) {
      console.log("No Alpaca API key found, skipping WebSocket connection");
      return;
    }

    console.log("Connecting to Alpaca WebSocket...");
    this.ws = new WebSocket("wss://stream.data.alpaca.markets/v2/iex");

    this.ws.on("open", () => {
      console.log("Connected to Alpaca WebSocket");
      setTimeout(() => {
        this.authenticate();
      }, 1000);
    });

    this.ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      const messages = Array.isArray(msg) ? msg : [msg];

      messages.forEach((message) => {
        if (message.msg === "authenticated") {
          this.isAuthenticated = true;
          console.log("Successfully authenticated with Alpaca");
          // No hardcoded subscriptions - wait for portfolio-based subscriptions
        }

        if (message.T && message.S && message.p) {
          this.prices.set(message.S, parseFloat(message.p));
          console.log(`Updated price for ${message.S}: $${message.p}`);
        }
      });
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.ws.on("close", (code, reason) => {
      console.log(`WebSocket closed: ${code} - ${reason}`);
      this.isAuthenticated = false;
    });
  }

  // Subscribe to user's portfolio symbols
  subscribeToPortfolio(symbols) {
    if (!this.ws || !this.isAuthenticated) {
      console.log("WebSocket not ready for subscription");
      return;
    }

    // Convert to array and filter out already subscribed symbols
    const newSymbols = symbols.filter(
      (symbol) => !this.subscribedSymbols.has(symbol)
    );

    if (newSymbols.length === 0) {
      console.log("All symbols already subscribed");
      return;
    }

    // Add to subscribed symbols
    newSymbols.forEach((symbol) => this.subscribedSymbols.add(symbol));

    console.log(`Subscribing to portfolio symbols: ${newSymbols.join(", ")}`);
    this.ws.send(
      JSON.stringify({
        action: "subscribe",
        trades: newSymbols,
      })
    );
  }

  // Unsubscribe from symbols not in portfolio
  unsubscribeFromPortfolio(currentPortfolioSymbols) {
    if (!this.ws || !this.isAuthenticated) {
      return;
    }

    const symbolsToUnsubscribe = Array.from(this.subscribedSymbols).filter(
      (symbol) => !currentPortfolioSymbols.includes(symbol)
    );

    if (symbolsToUnsubscribe.length === 0) {
      return;
    }

    // Remove from subscribed symbols
    symbolsToUnsubscribe.forEach((symbol) =>
      this.subscribedSymbols.delete(symbol)
    );

    console.log(
      `Unsubscribing from unused symbols: ${symbolsToUnsubscribe.join(", ")}`
    );
    this.ws.send(
      JSON.stringify({
        action: "unsubscribe",
        trades: symbolsToUnsubscribe,
      })
    );
  }

  async getPriceForSymbol(symbol) {
    // First check cache
    const existingPrice = this.prices.get(symbol);
    if (existingPrice) {
      return existingPrice;
    }

    // Fetch via REST API
    try {
      console.log(`Fetching price for ${symbol} via REST API...`);
      const response = await axios.get(
        `https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=${symbol}`,
        {
          headers: {
            "APCA-API-KEY-ID": this.config.alpaca.apiKey,
            "APCA-API-SECRET-KEY": this.config.alpaca.secretKey,
          },
        }
      );

      if (response.data.quotes && response.data.quotes[symbol]) {
        const quote = response.data.quotes[symbol];
        if (quote && quote.ap) {
          const price = parseFloat(quote.ap);
          this.prices.set(symbol, price);
          console.log(`Fetched latest price for ${symbol}: $${price}`);
          return price;
        }
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error.message);
    }

    return null;
  }

  authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not ready for authentication");
      return;
    }

    console.log("Authenticating with Alpaca...");
    const authMessage = {
      action: "auth",
      key: this.config.alpaca.apiKey,
      secret: this.config.alpaca.secretKey,
    };

    this.ws.send(JSON.stringify(authMessage));
  }

  getPrice(symbol) {
    return this.prices.get(symbol) || null;
  }

  async getPriceAsync(symbol) {
    const cachedPrice = this.prices.get(symbol);
    if (cachedPrice) {
      return cachedPrice;
    }
    return await this.getPriceForSymbol(symbol);
  }

  getAllPrices() {
    return Object.fromEntries(this.prices);
  }

  getConnectionStatus() {
    return {
      isConnected: !!this.ws && this.ws.readyState === WebSocket.OPEN,
      isAuthenticated: this.isAuthenticated,
      subscribedSymbols: Array.from(this.subscribedSymbols),
      pricesCount: this.prices.size,
    };
  }
}

module.exports = new AlpacaPrices();
