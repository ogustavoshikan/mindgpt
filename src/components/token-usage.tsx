import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

export function TokenUsage({ userId, refreshTrigger }: { userId: string, refreshTrigger: number }) {
    const supabase = createClient();
    const [usage, setUsage] = useState({ high_intelligence: 0, high_efficiency: 0 });

    useEffect(() => {
        const fetchUsage = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('token_daily_usage')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today);

            if (data) {
                const newUsage = { high_intelligence: 0, high_efficiency: 0 };
                data.forEach(row => {
                    if (row.model_tier === 'high_intelligence') newUsage.high_intelligence = row.tokens_used;
                    if (row.model_tier === 'high_efficiency') newUsage.high_efficiency = row.tokens_used;
                });
                setUsage(newUsage);
            }
        };
        fetchUsage();
    }, [userId, refreshTrigger]); // Recarrega sempre que o 'refreshTrigger' mudar (quando envia msg)

    // Limites
    const LIMIT_INTEL = 250000;
    const LIMIT_EFFIC = 2500000;

    const pctIntel = Math.min((usage.high_intelligence / LIMIT_INTEL) * 100, 100);
    const pctEffic = Math.min((usage.high_efficiency / LIMIT_EFFIC) * 100, 100);

    return (
        <div className="px-3 py-2 space-y-3 bg-black/20 mx-2 rounded-lg border border-white/5">
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <span>Alta Inteligência</span>
                    <span>{usage.high_intelligence.toLocaleString()} / 250k</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" style={{ width: `${pctIntel}%` }} />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <span>Alta Eficiência</span>
                    <span>{usage.high_efficiency.toLocaleString()} / 2.5M</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500" style={{ width: `${pctEffic}%` }} />
                </div>
            </div>
        </div>
    );
}