import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWeather, fetchNextF1, fetchStock } from './tools'
import { 
  weatherToolOutputSchema, 
  f1MatchesToolOutputSchema, 
  stockPriceToolOutputSchema 
} from './schemas'

// Mock environment variables
beforeEach(() => {
  // Set test environment variables
  process.env.OPENWEATHER_API_KEY = 'test-weather-key'
  process.env.ALPHAVANTAGE_API_KEY = 'test-stock-key'
})

describe('Tool Normalizers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchWeather', () => {
    it('should normalize valid OpenWeatherMap response', async () => {
      const mockResponse = {
        name: 'London',
        main: {
          temp: 293.15, // 20°C in Kelvin
          humidity: 65
        },
        weather: [{
          description: 'scattered clouds',
          icon: '03d'
        }],
        wind: {
          speed: 5.2 // m/s
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await fetchWeather('London')

      // Validate schema
      const validated = weatherToolOutputSchema.parse(result)
      expect(validated).toEqual(result)

      // Check normalized values
      expect(result.location).toBe('London')
      expect(result.tempC).toBe(20) // Converted from Kelvin
      expect(result.description).toBe('scattered clouds')
      expect(result.icon).toBe('03d')
      expect(result.humidity).toBe(65)
      expect(result.windKph).toBe(18.72) // Converted from m/s to km/h
    })

    it('should handle missing API key', async () => {
      // Temporarily override process.env for this test
      const originalKey = process.env.OPENWEATHER_API_KEY
      process.env.OPENWEATHER_API_KEY = undefined

      await expect(fetchWeather('London')).rejects.toThrow('OpenWeather API key not configured')
      
      // Restore original value
      process.env.OPENWEATHER_API_KEY = originalKey
    })

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      await expect(fetchWeather('London')).rejects.toThrow('Invalid OpenWeather API key')
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(fetchWeather('London')).rejects.toThrow('Network error')
    })
  })

  describe('fetchNextF1', () => {
    it('should normalize valid Ergast F1 response', async () => {
      const mockResponse = {
        MRData: {
          RaceTable: {
            Races: [{
              season: '2024',
              round: '1',
              raceName: 'Bahrain Grand Prix',
              Circuit: {
                circuitName: 'Bahrain International Circuit',
                Location: {
                  country: 'Bahrain'
                }
              },
              date: '2024-03-02',
              time: '15:00:00Z'
            }]
          }
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await fetchNextF1()

      // Validate schema
      const validated = f1MatchesToolOutputSchema.parse(result)
      expect(validated).toEqual(result)

      // Check normalized values
      expect(result.season).toBe('2024')
      expect(result.round).toBe(1)
      expect(result.raceName).toBe('Bahrain Grand Prix')
      expect(result.circuit).toBe('Bahrain International Circuit')
      expect(result.country).toBe('Bahrain')
      expect(result.date).toBe('2024-03-02')
      expect(result.time).toBe('15:00:00Z')
    })

    it('should handle empty race data', async () => {
      const mockResponse = {
        MRData: {
          RaceTable: {
            Races: []
          }
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      await expect(fetchNextF1()).rejects.toThrow('No upcoming F1 race found')
    })

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(fetchNextF1()).rejects.toThrow('F1 API error: 500')
    })
  })

  describe('fetchStock', () => {
    it('should normalize valid Alpha Vantage response', async () => {
      const mockResponse = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '150.25',
          '09. change': '2.50',
          '10. change percent': '1.69%'
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await fetchStock('AAPL')

      // Validate schema
      const validated = stockPriceToolOutputSchema.parse(result)
      expect(validated).toEqual(result)

      // Check normalized values
      expect(result.symbol).toBe('AAPL')
      expect(result.price).toBe(150.25)
      expect(result.change).toBe(2.50)
      expect(result.changePercent).toBe(1.69)
    })

    it('should handle missing API key', async () => {
      // Temporarily override process.env for this test
      const originalKey = process.env.ALPHAVANTAGE_API_KEY
      process.env.ALPHAVANTAGE_API_KEY = undefined

      await expect(fetchStock('AAPL')).rejects.toThrow('Alpha Vantage API key not configured')
      
      // Restore original value
      process.env.ALPHAVANTAGE_API_KEY = originalKey
    })

    it('should handle empty quote data', async () => {
      const mockResponse = {
        'Global Quote': {}
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      await expect(fetchStock('INVALID')).rejects.toThrow('Stock symbol "INVALID" not found or no data available')
    })

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      })

      await expect(fetchStock('AAPL')).rejects.toThrow('Stock API error: 429')
    })
  })
})
