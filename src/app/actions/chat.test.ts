import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createChat, listChats, getChat, appendMessage } from './chat'
import { 
  createChatInputSchema, 
  appendMessageInputSchema,
  chatDTOSchema,
  messageDTOSchema,
  chatWithMessagesDTOSchema
} from '@/lib/schemas'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock database
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn()
      }))
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn()
          }))
        }))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn()
        }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn()
      }))
    }))
  }
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Chat Server Actions', () => {
  const mockUserId = 'test-user-id'
  const mockChatId = 'test-chat-id'
  const mockMessageId = 'test-message-id'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful authentication
    const { getServerSession } = require('next-auth')
    getServerSession.mockResolvedValue({
      user: { id: mockUserId }
    })
  })

  describe('createChat', () => {
    it('should create a chat with default title', async () => {
      const input = {}
      const validatedInput = createChatInputSchema.parse(input)
      
      const mockChat = {
        id: mockChatId,
        title: 'Chat 1/1/2024, 12:00:00 PM',
        createdAt: new Date(),
        userId: mockUserId
      }

      const { db } = require('@/db')
      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockChat])
        })
      })

      const result = await createChat(input)

      // Validate schema
      const validated = chatDTOSchema.parse(result)
      expect(validated).toEqual(result)

      expect(result.id).toBe(mockChatId)
      expect(result.title).toMatch(/^Chat \d+\/\d+\/\d+, \d+:\d+:\d+ [AP]M$/)
      expect(result.messageCount).toBe(0)
    })

    it('should create a chat with custom title', async () => {
      const input = { title: 'Custom Chat Title' }
      const validatedInput = createChatInputSchema.parse(input)
      
      const mockChat = {
        id: mockChatId,
        title: 'Custom Chat Title',
        createdAt: new Date(),
        userId: mockUserId
      }

      const { db } = require('@/db')
      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockChat])
        })
      })

      const result = await createChat(input)

      expect(result.title).toBe('Custom Chat Title')
    })

    it('should throw error when user not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      await expect(createChat({})).rejects.toThrow('Unauthorized: User not authenticated')
    })
  })

  describe('listChats', () => {
    it('should return user chats with message counts', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          title: 'Chat 1',
          createdAt: new Date('2024-01-01'),
          userId: mockUserId
        },
        {
          id: 'chat-2',
          title: 'Chat 2',
          createdAt: new Date('2024-01-02'),
          userId: mockUserId
        }
      ]

      const { db } = require('@/db')
      
      // Mock chat selection
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockChats)
          })
        })
      })

      // Mock message count queries
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'msg-1' }, { id: 'msg-2' }])
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'msg-3' }])
        })
      })

      const result = await listChats()

      expect(result).toHaveLength(2)
      expect(result[0].messageCount).toBe(2)
      expect(result[1].messageCount).toBe(1)
      
      // Validate each chat schema
      result.forEach(chat => {
        const validated = chatDTOSchema.parse(chat)
        expect(validated).toEqual(chat)
      })
    })

    it('should throw error when user not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      await expect(listChats()).rejects.toThrow('Unauthorized: User not authenticated')
    })
  })

  describe('getChat', () => {
    it('should return chat with messages', async () => {
      const mockChat = {
        id: mockChatId,
        title: 'Test Chat',
        createdAt: new Date(),
        userId: mockUserId
      }

      const mockMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: { text: 'Hello' },
          createdAt: new Date()
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: { text: 'Hi there!' },
          createdAt: new Date()
        }
      ]

      const { db } = require('@/db')
      
      // Mock chat selection
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockChat])
          })
        })
      })

      // Mock messages selection
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockMessages)
          })
        })
      })

      const result = await getChat(mockChatId)

      // Validate schema
      const validated = chatWithMessagesDTOSchema.parse(result)
      expect(validated).toEqual(result)

      expect(result.id).toBe(mockChatId)
      expect(result.title).toBe('Test Chat')
      expect(result.messages).toHaveLength(2)
      expect(result.messages[0].role).toBe('user')
      expect(result.messages[1].role).toBe('assistant')
    })

    it('should throw error when chat not found', async () => {
      const { db } = require('@/db')
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })

      await expect(getChat('non-existent')).rejects.toThrow('Chat not found')
    })

    it('should throw error when user not authorized', async () => {
      const mockChat = {
        id: mockChatId,
        title: 'Test Chat',
        createdAt: new Date(),
        userId: 'different-user-id'
      }

      const { db } = require('@/db')
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockChat])
          })
        })
      })

      await expect(getChat(mockChatId)).rejects.toThrow('Unauthorized: Access denied to this chat')
    })
  })

  describe('appendMessage', () => {
    it('should append message to chat', async () => {
      const input = {
        chatId: mockChatId,
        role: 'user' as const,
        content: { text: 'Hello world' }
      }
      const validatedInput = appendMessageInputSchema.parse(input)
      
      const mockChat = {
        id: mockChatId,
        title: 'Test Chat',
        createdAt: new Date(),
        userId: mockUserId
      }

      const mockMessage = {
        id: mockMessageId,
        chatId: mockChatId,
        role: 'user' as const,
        content: { text: 'Hello world' },
        createdAt: new Date()
      }

      const { db } = require('@/db')
      
      // Mock chat verification
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockChat])
          })
        })
      })

      // Mock message insertion
      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMessage])
        })
      })

      const result = await appendMessage(input)

      // Validate schema
      const validated = messageDTOSchema.parse(result)
      expect(validated).toEqual(result)

      expect(result.id).toBe(mockMessageId)
      expect(result.role).toBe('user')
      expect(result.content).toEqual({ text: 'Hello world' })
    })

    it('should throw error when chat not found', async () => {
      const input = {
        chatId: 'non-existent',
        role: 'user' as const,
        content: { text: 'Hello' }
      }

      const { db } = require('@/db')
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })

      await expect(appendMessage(input)).rejects.toThrow('Chat not found')
    })

    it('should throw error when user not authorized', async () => {
      const input = {
        chatId: mockChatId,
        role: 'user' as const,
        content: { text: 'Hello' }
      }

      const mockChat = {
        id: mockChatId,
        title: 'Test Chat',
        createdAt: new Date(),
        userId: 'different-user-id'
      }

      const { db } = require('@/db')
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockChat])
          })
        })
      })

      await expect(appendMessage(input)).rejects.toThrow('Unauthorized: Access denied to this chat')
    })
  })
})
