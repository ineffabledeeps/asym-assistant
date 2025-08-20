import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Input validation schema
const chatInputSchema = z.object({
  messages: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.any(),
  })).optional(),
});

export async function POST(req: Request) {
  try {
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

    // Stream the AI response
    const result = await streamText({
      model,
      messages: conversation,
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
