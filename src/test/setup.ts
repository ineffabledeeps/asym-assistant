import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      accessToken: 'test-token',
    },
    status: 'authenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock server actions
vi.mock('@/app/actions/chat', () => ({
  createChat: vi.fn(),
  listChats: vi.fn(),
  getChat: vi.fn(),
  appendMessage: vi.fn(),
}))

// Mock fetch globally
global.fetch = vi.fn()
