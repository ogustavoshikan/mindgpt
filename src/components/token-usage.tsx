"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Zap } from "lucide-react";

interface TokenUsageProps {
  userId: string;
  refreshTrigger: number;
}

export function TokenUsage({ userId, refreshTrigger }: TokenUsageProps) {
  const [tokens, setTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Busca uso apenas se tiver userId
        if (!userId) return;

        const { data, error } = await supabase
          .from('token_daily_usage')
          .select('tokens_used')
          .eq('user_id', userId)
          .eq('date', today);

        if (error) {
            console.error("Erro Supabase:", error);
            return;
        }

        // SOMA SEGURA: Se vier null, usa 0.
        const total = data?.reduce((acc, curr) => acc + (curr.tokens_used || 0), 0) || 0;
        
        setTokens(total);
      } catch (err) {
        console.error("Erro fatal token usage:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [userId, refreshTrigger]);

  if (loading) return <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />;

  return (
    <div className="flex items-center justify-center w-full">
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-help" title="Tokens usados hoje">
            <Zap size={12} className="text-yellow-500 fill-yellow-500" />
            <span className="font-mono">
                {/* AQUI ESTAVA O ERRO: Agora garantimos que (tokens || 0) nunca é null */}
                {(tokens || 0).toLocaleString('pt-BR')} 
            </span>
            <span>tokens</span>
        </div>
    </div>
  );
}