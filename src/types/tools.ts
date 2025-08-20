// Tool input/output types for AI assistant tools
import type { 
  WeatherToolOutput,
  F1MatchesToolOutput, 
  StockPriceToolOutput 
} from '@/lib/schemas';

export interface WeatherToolInput {
  location: string;
}

export interface StockPriceToolInput {
  symbol: string;
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
