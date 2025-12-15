import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { tavily } from '@tavily/core';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

// AQUI ESTÁ A CORREÇÃO: Usamos a Service Role Key para garantir a escrita
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // <--- Certifique-se que está no .env.local

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, // Otimização para backend
  }
});

const HIGH_EFFICIENCY_MODELS = [
    'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1-mini', 'gpt-4.1-nano', 
    'gpt-4o-mini', 'o1-mini', 'o3-mini', 'o4-mini'
];

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt, model, useWeb, userId } = await req.json();

    const tools = {
      webSearch: tool({
        description: 'Search the web',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          const apiKey = process.env.TAVILY_API_KEY;
          if (!apiKey) return "Sem API Key.";
          const client = tavily({ apiKey });
          const response = await client.search(query, { topic: "general", maxResults: 5 });
          return JSON.stringify(response.results.map(r => ({ title: r.title, content: r.content, url: r.url })));
        },
      }),
    };

    const result = await streamText({
      model: openai(model || 'gpt-4o'),
      system: systemPrompt || "You are a helpful assistant.",
      messages: messages,
      tools: useWeb ? tools : undefined,
      maxSteps: 5,
      onFinish: async ({ usage }) => {
          if (userId && usage) {
              const totalTokens = usage.totalTokens;
              const tier = HIGH_EFFICIENCY_MODELS.includes(model) ? 'high_efficiency' : 'high_intelligence';
              
              console.log(`📊 [TOKENS] ID: ${userId} | +${totalTokens} (${tier})`);

              const today = new Date().toISOString().split('T')[0];

              // Usamos o supabaseAdmin para ignorar regras de RLS e forçar a escrita
              const { data: existing } = await supabaseAdmin
                  .from('token_daily_usage')
                  .select('id, tokens_used')
                  .eq('user_id', userId)
                  .eq('date', today)
                  .eq('model_tier', tier)
                  .single();

              if (existing) {
                  await supabaseAdmin
                      .from('token_daily_usage')
                      .update({ tokens_used: existing.tokens_used + totalTokens })
                      .eq('id', existing.id);
              } else {
                  await supabaseAdmin
                      .from('token_daily_usage')
                      .insert({ 
                          user_id: userId, 
                          date: today, 
                          model_tier: tier, 
                          tokens_used: totalTokens 
                      });
              }
          }
      }
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("❌ API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}