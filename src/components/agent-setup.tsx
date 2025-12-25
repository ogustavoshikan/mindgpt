"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
// import { createClient } from "@/lib/supabase"; // Removed, used in Picker
// import { toast } from "sonner"; // Removed
// import { ImageCropper } from "@/components/image-cropper"; // Removed
import { AgentIconPicker } from "@/components/agent-icon-picker";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
// DropdownMenu imports removed as they are now inside Picker
import {
    Bot, Search, Paperclip, Save,
    Trash2, Copy, Share2, PanelRightClose, Plus
} from "lucide-react";

interface AgentSetupProps {
    isOpen: boolean; onClose: () => void;
    agentName: string; setAgentName: (v: string) => void;
    agentDesc: string; setAgentDesc: (v: string) => void;
    systemPrompt: string; setSystemPrompt: (v: string) => void;
    model: string; setModel: (v: string) => void;
    useWeb: boolean; setUseWeb: (v: boolean) => void;
    useFiles: boolean; setUseFiles: (v: boolean) => void;
    agentIcon: string; setAgentIcon: (v: string) => void;
    onSave: () => void; isSaving: boolean; onCreateNew: () => void;
    agentsList: any[]; selectedAgentId: string | null; onSelectAgent: (id: string) => void;
}

export function AgentSetup({
    isOpen, onClose, agentName, setAgentName, agentDesc, setAgentDesc,
    systemPrompt, setSystemPrompt, model, setModel, useWeb, setUseWeb,
    useFiles, setUseFiles, agentIcon, setAgentIcon,
    onSave, isSaving, onCreateNew, agentsList, selectedAgentId, onSelectAgent
}: AgentSetupProps) {

    // State for Cropper Moved to AgentIconPicker

    return (
        <>
            <aside className={`bg-[#171717] border-l border-white/5 flex flex-col transition-all duration-300 ease-in-out h-full flex-shrink-0 z-20 overflow-hidden ${isOpen ? "w-[380px] translate-x-0 opacity-100" : "w-0 translate-x-full opacity-0 border-l-0"}`}>
                <div className="p-4 border-b border-white/5 bg-[#171717] flex-shrink-0 min-w-[380px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Construtor de Agente</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-white/5 h-6 w-6"><PanelRightClose size={18} /></Button>
                    </div>
                    <div className="space-y-3">
                        <Select value={selectedAgentId || "new"} onValueChange={(val) => { if (val === "new") onCreateNew(); else onSelectAgent(val); }}>
                            <SelectTrigger className="w-full bg-[#212121] border-white/10 text-white focus:ring-0 h-10"><SelectValue placeholder="Selecione um Agente" /></SelectTrigger>
                            <SelectContent className="bg-[#212121] border-zinc-700 text-white"><SelectItem value="new" className="text-zinc-400 font-medium">+ Criar Novo Agente</SelectItem>{agentsList.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}</SelectContent>
                        </Select>
                        <div className="flex gap-2"><Button variant="outline" onClick={onCreateNew} className="flex-1 bg-transparent border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 text-xs"><Plus size={12} className="mr-1" /> Novo</Button><Button className="flex-1 bg-[#FF5500] hover:bg-[#FF5500]/90 text-white h-9 text-xs font-semibold border-none">Ativo</Button></div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative min-w-[380px]">
                    <ScrollArea className="h-full w-full">
                        <div className="p-4 space-y-6 pb-20">
                            <div className="flex flex-col items-center gap-3">
                                <AgentIconPicker agentIcon={agentIcon} setAgentIcon={setAgentIcon} />
                                <span className="text-xs text-zinc-500 font-medium">Clique para alterar</span>
                            </div>

                            {/* Campos de Texto */}
                            <div className="space-y-4">
                                <div className="space-y-1.5"><Label className="text-xs text-zinc-400 font-medium">Nome</Label><Input className="bg-[#212121] border-white/10 text-zinc-200 focus-visible:ring-1 focus-visible:ring-white/20 h-10" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Ex: Jarvis" /></div>
                                <div className="space-y-1.5"><Label className="text-xs text-zinc-400 font-medium">Descrição</Label><Input className="bg-[#212121] border-white/10 text-zinc-200 focus-visible:ring-1 focus-visible:ring-white/20 h-10" value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} placeholder="Ex: Assistente Pessoal" /></div>
                                <div className="space-y-1.5"><div className="flex justify-between items-center"><Label className="text-xs text-zinc-400 font-medium">Instruções</Label><span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-white/5 cursor-pointer hover:bg-zinc-700">@ Variáveis</span></div><textarea className="w-full bg-[#212121] border border-white/10 rounded-md p-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[200px] resize-y leading-relaxed font-mono" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="Comportamento..." /></div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400 font-medium">Modelo</Label>
                                    <Select value={model} onValueChange={setModel}>
                                        <SelectTrigger className="w-full bg-[#212121] border-white/10 text-zinc-200 h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-[#212121] border-zinc-700 text-white max-h-[300px]">
                                            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Alta Inteligência (250k/dia)</div>
                                            <SelectItem value="gpt-5.1">GPT-5.1</SelectItem><SelectItem value="gpt-5">GPT-5</SelectItem><SelectItem value="gpt-5-chat-latest">GPT-5 Chat Latest</SelectItem><SelectItem value="gpt-4.1">GPT-4.1</SelectItem><SelectItem value="gpt-4o">GPT-4o</SelectItem><SelectItem value="o1">o1</SelectItem><SelectItem value="o3">o3</SelectItem>
                                            <div className="px-2 py-1.5 mt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-t border-white/5 pt-2">Alta Eficiência (2.5M/dia)</div>
                                            <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem><SelectItem value="gpt-5-nano">GPT-5 Nano</SelectItem><SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem><SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem><SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem><SelectItem value="o1-mini">o1 Mini</SelectItem><SelectItem value="o3-mini">o3 Mini</SelectItem><SelectItem value="o4-mini">o4 Mini</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <Label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Capacidades</Label>
                                    <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-white/5" onClick={() => setUseWeb(!useWeb)}><div className="flex items-center gap-3"><Checkbox checked={useWeb} onCheckedChange={(c) => setUseWeb(c as boolean)} className="border-zinc-500 data-[state=checked]:bg-[#FF5500] data-[state=checked]:border-[#FF5500] text-white" /><Label className="text-sm text-zinc-300 font-normal cursor-pointer">Busca na web</Label></div><Search size={16} className={`transition-colors ${useWeb ? 'text-[#FF5500]' : 'text-zinc-600 group-hover:text-zinc-400'}`} /></div>
                                    <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-white/5" onClick={() => setUseFiles(!useFiles)}><div className="flex items-center gap-3"><Checkbox checked={useFiles} onCheckedChange={(c) => setUseFiles(c as boolean)} className="border-zinc-500 data-[state=checked]:bg-[#FF5500] data-[state=checked]:border-[#FF5500] text-white" /><Label className="text-sm text-zinc-300 font-normal cursor-pointer">Arquivos</Label></div><Paperclip size={16} className={`transition-colors ${useFiles ? 'text-[#FF5500]' : 'text-zinc-600 group-hover:text-zinc-400'}`} /></div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
                <div className="p-4 border-t border-white/5 flex flex-col gap-3 bg-[#171717] flex-shrink-0 min-w-[380px]">
                    <Button onClick={onSave} disabled={isSaving} className="w-full bg-[#FF5500] hover:bg-[#FF5500]/90 text-white font-semibold shadow-lg shadow-orange-900/10 h-10 transition-all">{isSaving ? "Salvando..." : (<><Save size={16} className="mr-2" /> Salvar Alterações</>)}</Button>
                    <div className="flex justify-between text-[10px] text-zinc-500 px-1 pt-1"><span className="cursor-pointer hover:text-zinc-300 flex items-center gap-1 transition-colors"><Copy size={12} /> Duplicar</span><span className="cursor-pointer hover:text-zinc-300 flex items-center gap-1 transition-colors"><Share2 size={12} /> Compartilhar</span><span className="cursor-pointer hover:text-red-400 flex items-center gap-1 transition-colors"><Trash2 size={12} /> Deletar</span></div>
                </div>
            </aside>
        </>
    );
}