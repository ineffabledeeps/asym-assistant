// Tool input/output types for AI assistant tools

export interface WeatherToolInput {
  location: string;
}

export interface WeatherToolOutput {
  location: string;
  tempC: number;
  description: string;
  icon: string;
  humidity: number;
  windKph: number;
}

export interface F1MatchesToolOutput {
  season: string;
  round: number;
  raceName: string;
  circuit: string;
  country: string;
  date: string;
  time?: string;
}

export interface StockPriceToolInput {
  symbol: string;
}

export interface StockPriceToolOutput {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
}

// Union type for all tool outputs
export type ToolOutput = 
  | WeatherToolOutput 
  | F1MatchesToolOutput 
  | StockPriceToolOutput;

// Tool definitions for AI SDK
export const toolDefinitions = {
  getWeather: {
    name: 'getWeather',
    description: 'Get current weather information for a specific location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, coordinates, or location identifier'
        }
      },
      required: ['location']
    }
  },
  getF1Matches: {
    name: 'getF1Matches',
    description: 'Get Formula 1 race schedule and match information',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  getStockPrice: {
    name: 'getStockPrice',
    description: 'Get current stock price and change information for a stock symbol',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock symbol (e.g., AAPL, GOOGL, MSFT)'
        }
      },
      required: ['symbol']
    }
  }
} as const;
