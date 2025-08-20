# asym-assistant

A modern AI-powered chat assistant built with Next.js 15, featuring real-time tool calling for weather, F1 races, and stock prices.

## 🚀 Features

- **🤖 AI Chat Interface** - Streaming chat with OpenAI GPT models
- **🛠️ Tool Calling** - Real-time weather, F1 race, and stock price data
- **🔐 OAuth Authentication** - Google and GitHub sign-in via NextAuth.js
- **💾 Persistent Conversations** - Chat history stored in PostgreSQL
- **⚡ Real-time Streaming** - Server-sent events for smooth chat experience
- **🛡️ Rate Limiting** - Built-in protection against API abuse
- **📱 Responsive Design** - Mobile-first UI with Tailwind CSS
- **🌙 Dark Mode Support** - Automatic theme switching
- **🔒 Route Protection** - Middleware-based authentication guards
- **📊 Empty States** - Graceful handling of no data scenarios
- **🎯 Error Handling** - User-friendly error messages and recovery

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hot Toast** - Elegant notifications
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless backend
- **NextAuth.js v4** - Authentication & session management
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database (Neon/Supabase)

### AI & APIs
- **Vercel AI SDK** - AI model integration and streaming
- **OpenAI GPT** - Large language model
- **OpenWeatherMap** - Weather data
- **Ergast F1 API** - Formula 1 race information
- **Alpha Vantage** - Stock market data

### Infrastructure
- **Vercel** - Deployment and hosting
- **Neon/Supabase** - Managed PostgreSQL
- **Environment Variables** - Secure configuration

## 🏛️ Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client (Browser)"
        UI[React Components]
        State[Client State]
        Router[Next.js Router]
    end
    
    subgraph "Next.js App Router"
        Pages[Page Components]
        API[API Routes]
        MW[Middleware]
        SA[Server Actions]
    end
    
    subgraph "Authentication"
        NextAuth[NextAuth.js]
        Providers[OAuth Providers]
        JWT[JWT Sessions]
    end
    
    subgraph "Database Layer"
        Drizzle[Drizzle ORM]
        PG[PostgreSQL]
        Schema[Database Schema]
    end
    
    subgraph "AI & External APIs"
        OpenAI[OpenAI API]
        Weather[OpenWeatherMap]
        F1[Ergast F1 API]
        Stock[Alpha Vantage]
    end
    
    subgraph "Infrastructure"
        Vercel[Vercel Platform]
        Neon[Neon Database]
        CDN[Vercel CDN]
    end
    
    UI --> Pages
    Pages --> SA
    Pages --> API
    MW --> NextAuth
    API --> Drizzle
    API --> OpenAI
    API --> Weather
    API --> F1
    API --> Stock
    SA --> Drizzle
    Drizzle --> PG
    NextAuth --> Providers
    NextAuth --> JWT
    
    Vercel --> CDN
    PG --> Neon
```

### SSR/CSR Design Decisions

#### Server-Side Rendering (SSR)
- **Landing Page** (`/`) - Static content for SEO and fast initial load
- **Chat Page** (`/chat`) - Server component that:
  - Validates authentication server-side
  - Loads initial chat list and selected chat messages
  - Handles URL parameters for chat selection
  - Creates new chats when needed

#### Client-Side Rendering (CSR)
- **Chat Interface** (`<ChatPanel/>`) - Client component for:
  - Real-time message streaming
  - Interactive UI elements (input, buttons)
  - State management for messages and UI
  - Toast notifications and error handling
- **Navigation** (`<Navbar/>`) - Client component for:
  - Authentication state display
  - Dynamic navigation based on auth status
  - Interactive sign-in/out buttons

#### Hybrid Approach Benefits
1. **SEO & Performance** - Server-rendered initial content
2. **Interactivity** - Client-side streaming and real-time updates
3. **Data Freshness** - Server actions for mutations, client state for UI
4. **Progressive Enhancement** - Works with JS disabled for core features

## 🗄️ Database Schema

```sql
-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table with JSONB content
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

## 🔧 Environment Variables

Create a `.env.local` file in the project root:

```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# GitHub OAuth  
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# AI Provider
OPENAI_API_KEY=your-openai-api-key

# Tool APIs
OPENWEATHER_API_KEY=your-openweather-api-key
ALPHAVANTAGE_API_KEY=your-alphavantage-api-key

# Optional: Supabase (if using instead of Neon)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### API Key Setup Instructions

#### 1. OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the key and add to `OPENAI_API_KEY`

#### 2. Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

#### 3. GitHub OAuth
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret

#### 4. OpenWeatherMap API
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to "API keys" section
4. Copy your default API key

#### 5. Alpha Vantage API
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Copy your API key from the confirmation email

## 🏃‍♂️ Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (local or cloud)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asym-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up the database**
   ```bash
   # Generate database schema
   npm run drizzle:generate
   
   # Run migrations
   npm run drizzle:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
# Generate new migration from schema changes
npm run drizzle:generate

# Apply migrations to database
npm run drizzle:migrate

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio
```

### Seeding Data (Optional)

Currently, the application creates data organically through user interactions. To seed test data:

1. Sign in through the UI
2. Create a few test chats
3. Send messages to populate the database

For automated seeding, you can create a seed script:

```typescript
// scripts/seed.ts
import { db } from './src/db';
import { chats, messages } from './src/db/schema';

async function seed() {
  // Insert sample chats and messages
  const [chat] = await db.insert(chats).values({
    userId: 'test-user-id',
    title: 'Sample Chat'
  }).returning();
  
  await db.insert(messages).values([
    {
      chatId: chat.id,
      role: 'user',
      content: { text: 'Hello!' }
    },
    {
      chatId: chat.id,
      role: 'assistant', 
      content: { text: 'Hi there! How can I help you today?' }
    }
  ]);
}

seed().catch(console.error);
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Set up environment variables in Vercel**
   - Go to your project dashboard
   - Navigate to Settings → Environment Variables
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain

3. **Database Setup Options**

   #### Option A: Neon (Recommended)
   ```bash
   # 1. Sign up at https://neon.tech
   # 2. Create a new project
   # 3. Copy the connection string
   # 4. Add to Vercel environment variables as DATABASE_URL
   ```

   #### Option B: Supabase
   ```bash
   # 1. Sign up at https://supabase.com
   # 2. Create a new project
   # 3. Go to Settings → Database
   # 4. Copy the connection string
   # 5. Add to Vercel environment variables as DATABASE_URL
   ```

4. **Run migrations on production**
   ```bash
   # After deploying, run migrations
   vercel env pull .env.production
   npm run drizzle:migrate
   ```

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test OAuth flows with production URLs
- [ ] Run database migrations
- [ ] Test all API endpoints
- [ ] Verify rate limiting works
- [ ] Test tool calling functionality

## 🏎️ F1 API Context & Future Migration

### Current Implementation: Ergast API

The application currently uses the **Ergast F1 API** for Formula 1 race data. However, there are important considerations:

#### Ergast Deprecation Status
- **Current Status**: Still operational but with deprecation warnings
- **Timeline**: No official shutdown date announced
- **Context**: The Ergast project has indicated it may discontinue service
- **References**: 
  - [GitHub Discussion](https://github.com/jcnewell/ergast-f1-api)
  - [Reddit Community Posts](https://www.reddit.com/r/formula1/comments/ergast_api/)

#### Migration Strategy

When Ergast becomes unavailable, consider these alternatives:

1. **Official F1 API** (if available)
   - Check F1's official developer resources
   - May require paid subscription

2. **Sports Data APIs**
   ```typescript
   // Example: SportRadar F1 API
   const response = await fetch(
     `https://api.sportradar.com/f1/trial/v2/en/sport_events.json?api_key=${API_KEY}`
   );
   ```

3. **Custom Data Scraping**
   ```typescript
   // Example: F1 official website scraping
   const response = await fetch('https://www.formula1.com/en/racing/2024.html');
   // Parse HTML for race data
   ```

#### Migration Instructions

To swap the F1 data provider:

1. **Update the fetch function**
   ```typescript
   // src/lib/tools.ts
   export async function fetchNextF1(): Promise<F1MatchesToolOutput> {
     // Replace Ergast API call with new provider
     const response = await fetch('NEW_API_ENDPOINT');
     // Update response parsing logic
   }
   ```

2. **Update environment variables**
   ```bash
   # Add new API key if required
   F1_API_KEY=your-new-f1-api-key
   ```

3. **Update error handling**
   ```typescript
   // Handle new API's error responses
   if (!response.ok) {
     throw new Error(`New F1 API error: ${response.status}`);
   }
   ```

4. **Test thoroughly**
   - Verify data format matches `F1MatchesToolOutput` interface
   - Test error scenarios
   - Update API rate limits if different

## 🛠️ Development Tips

### Adding New Tools

1. **Define types** in `src/types/tools.ts`
2. **Create fetcher** in `src/lib/tools.ts`  
3. **Add to AI SDK** in `src/app/api/chat/route.ts`
4. **Create UI card** in `src/components/`
5. **Update rendering** in `ChatPanel.tsx`

### Debugging

```bash
# View logs in development
npm run dev

# Check database with Drizzle Studio
npx drizzle-kit studio

# Test API endpoints
curl http://localhost:3000/api/chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### Performance Monitoring

- Use Vercel Analytics for performance insights
- Monitor OpenAI API usage and costs
- Set up error tracking (Sentry recommended)
- Monitor database performance with connection pooling

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Authentication not working**
- Check OAuth redirect URLs match exactly
- Verify `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches your domain

**Database connection errors**
- Verify `DATABASE_URL` format
- Check database is accessible from your network
- Run migrations with `npm run drizzle:migrate`

**API tools not working**
- Verify API keys are correct and active
- Check rate limits on external APIs
- Review network/firewall restrictions

**Build failures**
- Clear `.next` folder and rebuild
- Check TypeScript errors
- Verify all environment variables are set

For more help, check the issues section or create a new issue with detailed information about your problem.