import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { fetchWeather, fetchNextF1, fetchStock } from '@/lib/tools';
import { getServerSession } from 'next-auth';
import NextAuth from '@/lib/auth';
import { defaultRateLimiter } from '@/lib/rateLimit';

// Input validation schema
const chatInputSchema = z.object({
  messages: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(NextAuth) as { user?: { id: string } } | null;
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimitResult = await defaultRateLimiter.checkLimit(session.user.id);
    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.resetTime).toISOString();
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          resetTime,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': resetTime,
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          } 
        }
      );
    }

    const body = await req.json();
    const { messages } = chatInputSchema.parse(body);

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

    // Create the AI model instance
    const model = openai('gpt-4o-mini');



    // Prepare the conversation history
    const conversation = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Stream the AI response with tools
    const result = await streamText({
      model,
      messages: conversation,
      tools: {
        getWeather: {
          description: 'Get current weather information for a specific location',
          inputSchema: z.object({
            location: z.string().describe('City name, coordinates, or location identifier')
          }),
          execute: async ({ location }: { location: string }) => {
            console.log(`Weather tool called for location: ${location}`);
            return await fetchWeather(location);
          }
        },
        getF1Matches: {
          description: 'Get Formula 1 race schedule and match information',
          inputSchema: z.object({}),
          execute: async () => {
            console.log('F1 tool called');
            return await fetchNextF1();
          }
        },
        getStockPrice: {
          description: 'Get current stock price and change information for a stock symbol',
          inputSchema: z.object({
            symbol: z.string().describe('Stock symbol (e.g., AAPL, GOOGL, MSFT)')
          }),
          execute: async ({ symbol }: { symbol: string }) => {
            console.log(`Stock tool called for symbol: ${symbol}`);
            return await fetchStock(symbol);
          }
        }
      }
    });

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the text content
          for await (const delta of result.textStream) {
            const chunk = `data: ${JSON.stringify({
              type: 'text-delta',
              delta: delta,
              usage: result.usage,
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // Send final usage data
          const finalChunk = `data: ${JSON.stringify({
            type: 'done',
            usage: result.usage,
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(finalChunk));
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
