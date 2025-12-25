"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Bot, User, Paperclip, PanelLeftClose, Search,
    PanelRightClose, Send, LogOut, MoreHorizontal,
    PanelLeft, ChevronDown, Plus, Trash2,
    Copy, Check, RotateCcw, ThumbsUp, ThumbsDown
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentSetup } from "@/components/agent-setup";
import { ICON_MAP } from "@/components/agent-icon-picker";
import { LoginDialog } from "@/components/login-dialog";
import { TokenUsage } from "@/components/token-usage";
import { SmoothStream } from "@/components/smooth-stream";
import { DeleteDialog } from "@/components/delete-dialog";
import { createClient } from "@/lib/supabase";
import { toast, Toaster } from "sonner";

const CopyButton = ({ text, className }: { text: string, className?: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    return (
        <Button variant="ghost" size="icon" onClick={handleCopy} className={className} title="Copiar">
            {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </Button>
    );
};

export default function ChatInterface() {
    const supabase = createClient();

    // ESTADOS GERAIS
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [refreshTokens, setRefreshTokens] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // DADOS
    const [user, setUser] = useState<any>(null);
    const [agentsList, setAgentsList] = useState<any[]>([]);
    const [chatList, setChatList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // AGENTE ATUAL
    const [agentId, setAgentId] = useState<string | null>(null);
    const [agentName, setAgentName] = useState("Novo Agente");
    const [agentDesc, setAgentDesc] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [model, setModel] = useState("gpt-4o");
    const [useWeb, setUseWeb] = useState(false);
    const [useFiles, setUseFiles] = useState(false);
    const [agentIcon, setAgentIcon] = useState("Bot");
    const [isSavingAgent, setIsSavingAgent] = useState(false);

    // --- RENDER ICON ---
    const renderAgentIcon = (iconString: string, sizeClass: string) => {
        if (iconString.startsWith("http")) {
            return <img src={iconString} alt="Agent" className={`${sizeClass} rounded-full object-cover`} />;
        }
        const IconComp = ICON_MAP[iconString] || Bot;
        const pixelSize = sizeClass.includes("w-8") ? 18 : 32;
        return <IconComp size={pixelSize} className="text-white" />;
    };

    const { messages, input, setInput, handleInputChange, setMessages, append, isLoading, reload } = useChat({
        api: '/api/chat',
        body: { model, systemPrompt, useWeb, userId: user?.id },
        onFinish: async (message) => {
            if (activeChatId) {
                await supabase.from('messages').insert({ chat_id: activeChatId, role: 'assistant', content: message.content });
                fetchChats(user?.id);
            }
            setRefreshTokens(prev => prev + 1);
        },
        onError: (error) => toast.error("Erro: " + error.message)
    });

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) { await fetchAgents(user.id); await fetchChats(user.id); }
        };
        initData();
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const adjustTextareaHeight = () => {
        const el = textareaRef.current;
        if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 200)}px`; }
    };
    const handleInputWithResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => { handleInputChange(e); adjustTextareaHeight(); };

    const filteredChats = chatList.filter(chat => chat.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    const fetchAgents = async (userId: string) => { const { data } = await supabase.from('agents').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (data) setAgentsList(data); };
    const fetchChats = async (userId: string) => { const { data } = await supabase.from('chats').select('*').eq('user_id', userId).order('updated_at', { ascending: false }); if (data) setChatList(data); };

    const loadChat = async (chatId: string) => {
        const { data: msgs } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
        if (msgs) { setMessages(msgs.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content }))); }
        setActiveChatId(chatId);
        const { data: chatData } = await supabase.from('chats').select('agent_id').eq('id', chatId).single();
        if (chatData?.agent_id) { const agent = agentsList.find(a => a.id === chatData.agent_id); if (agent) loadAgentIntoState(agent); }
    };

    const loadAgentIntoState = (agent: any) => {
        setAgentId(agent.id); setAgentName(agent.name); setAgentDesc(agent.description || "");
        setSystemPrompt(agent.system_prompt || ""); setModel(agent.model || "gpt-4o");
        setUseWeb(agent.capabilities?.web || false); setUseFiles(agent.capabilities?.files || false);
        setAgentIcon(agent.icon || "Bot");
    };

    const handleSelectAgent = (id: string) => { const agent = agentsList.find(a => a.id === id); if (agent) { loadAgentIntoState(agent); setMessages([]); setActiveChatId(null); } };

    const handleCustomSubmit = async () => {
        if (!input.trim()) return;
        if (!user) { setIsLoginOpen(true); return; }
        const userText = input;
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        let currentChatId = activeChatId;
        if (!currentChatId) { const { data: newChat } = await supabase.from('chats').insert({ user_id: user.id, agent_id: agentId, title: userText.slice(0, 30) }).select().single(); if (newChat) { currentChatId = newChat.id; setActiveChatId(currentChatId); fetchChats(user.id); } }
        if (currentChatId) await supabase.from('messages').insert({ chat_id: currentChatId, role: 'user', content: userText });
        append({ role: 'user', content: userText });
    };

    // Ação de Novo Chat agora associada ao Logo
    const handleCreateNewChat = () => { setActiveChatId(null); setMessages([]); };

    const handleCreateNewAgent = () => {
        setAgentId(null); setAgentName("Novo Agente"); setAgentDesc(""); setSystemPrompt("");
        setModel("gpt-4o"); setUseWeb(false); setUseFiles(false); setAgentIcon("Bot");
        handleCreateNewChat();
    };
    const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setAgentsList([]); setChatList([]); handleCreateNewAgent(); };

    const handleSaveAgent = async () => {
        if (!user) { setIsLoginOpen(true); return; }
        setIsSavingAgent(true);
        try {
            const agentData = {
                user_id: user.id, name: agentName || "Novo Agente", description: agentDesc,
                system_prompt: systemPrompt, model: model, capabilities: { web: useWeb, files: useFiles },
                icon: agentIcon,
                updated_at: new Date().toISOString()
            };
            if (agentId) await supabase.from('agents').update(agentData).eq('id', agentId);
            else { const { data } = await supabase.from('agents').insert(agentData).select().single(); if (data) setAgentId(data.id); }
            fetchAgents(user.id);
        } catch (error: any) { toast.error("Erro", { description: error.message }); } finally { setIsSavingAgent(false); }
    };

    const confirmDeleteChat = (e: any, chatId: string) => {
        e.stopPropagation();
        setChatToDelete(chatId);
        setIsDeleteDialogOpen(true);
    };

    const executeDeleteChat = async () => {
        if (!chatToDelete) return;
        await supabase.from('chats').delete().eq('id', chatToDelete);
        setChatList(prev => prev.filter(c => c.id !== chatToDelete));
        if (activeChatId === chatToDelete) handleCreateNewChat();
        setIsDeleteDialogOpen(false);
        setChatToDelete(null);
        toast.success("Conversa apagada.");
    };

    return (
        <div className="flex h-screen w-full bg-[#212121] text-zinc-50 overflow-hidden font-sans">
            <Toaster position="top-center" theme="dark" />
            <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
            <DeleteDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={executeDeleteChat} />

            <aside className={`bg-[#171717] flex flex-col flex-shrink-0 border-r border-white/5 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-[260px] translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden"}`}>

                {/* --- HEADER UNIFICADO (LOGO + FECHAR) --- */}
                <div className="h-14 flex items-center justify-between px-3 border-b border-white/5 flex-shrink-0">
                    {/* Logo que funciona como botão de Novo Chat */}
                    <Button
                        variant="ghost"
                        className="h-10 px-2 flex items-center gap-2 hover:bg-white/5 text-zinc-100 hover:text-white transition-colors"
                        onClick={handleCreateNewChat}
                        title="Novo Chat"
                    >
                        {/* Usando logo.png conforme sua estrutura */}
                        <img src="/logo.png" alt="MindGPT" className="w-6 h-6 rounded-sm" />
                    </Button>

                    {/* Botão de Fechar Sidebar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                        <PanelLeftClose size={20} />
                    </Button>
                </div>

                <div className="px-2 mb-2 mt-3 relative">
                    <Search size={14} className="absolute left-4 top-3 text-zinc-500" />
                    <input className="w-full bg-[#212121] text-zinc-200 text-sm rounded-lg pl-8 pr-2 h-9 border border-transparent focus:border-white/10 focus:outline-none placeholder:text-zinc-500" placeholder="Buscar mensagens" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <ScrollArea className="flex-1 px-2">
                    {filteredChats.map((chat) => (
                        <div key={chat.id} onClick={() => loadChat(chat.id)} className={`group flex items-center justify-between w-full p-2 rounded-lg cursor-pointer text-sm transition-colors ${activeChatId === chat.id ? "bg-[#212121] text-white" : "text-zinc-400 hover:bg-[#212121] hover:text-zinc-200"}`}>
                            <span className="truncate flex-1">{chat.title}</span>
                            <Trash2 size={14} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity" onClick={(e) => confirmDeleteChat(e, chat.id)} />
                        </div>
                    ))}
                </ScrollArea>
                <div className="mt-auto p-2">
                    {user && <TokenUsage userId={user.id} refreshTrigger={refreshTokens} />}
                </div>
                <div className="p-3 border-t border-white/5">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-[#212121] h-12 rounded-xl"><Avatar className="h-8 w-8 rounded-sm"><AvatarImage src={user?.user_metadata?.avatar_url} /><AvatarFallback className="rounded-sm bg-green-600">{user.email[0].toUpperCase()}</AvatarFallback></Avatar><div className="text-left flex-1 overflow-hidden"><p className="text-sm font-medium text-zinc-200 truncate">{user.email}</p></div><MoreHorizontal size={16} className="text-zinc-500" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#171717] border-white/10 text-white mb-2 ml-2" align="start" side="top"><DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"><LogOut className="mr-2 h-4 w-4" /> Sair</DropdownMenuItem></DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={() => setIsLoginOpen(true)} variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-[#212121] h-12 rounded-xl"><div className="h-8 w-8 rounded-sm bg-zinc-700 flex items-center justify-center"><User size={16} className="text-zinc-300" /></div><div className="text-left flex-1"><p className="text-sm font-medium text-zinc-200">Fazer Login</p></div></Button>
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col bg-[#212121] relative min-w-0">
                <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 w-full bg-[#212121] z-10 border-b border-transparent">
                    <div className="flex items-center gap-2">
                        {!isSidebarOpen && (<Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 hover:text-white mr-2 hover:bg-white/5"><PanelLeft size={20} /></Button>)}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-[#2f2f2f] group select-none">
                                    {renderAgentIcon(agentIcon, "w-5 h-5")}
                                    <span className="font-semibold text-zinc-200 text-lg opacity-90 group-hover:opacity-100">{agentName}</span>
                                    <span className="text-zinc-500 text-lg">{model.replace('gpt-', '')}</span>
                                    <ChevronDown size={16} className="text-zinc-500 mt-1 opacity-50 group-hover:opacity-100" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-80 bg-[#2f2f2f] border-zinc-700 text-white p-2 rounded-xl shadow-2xl" align="start">
                                <DropdownMenuLabel className="text-xs text-zinc-400 font-normal uppercase tracking-wider px-3 py-2">
                                    Modelos
                                </DropdownMenuLabel>

                                <DropdownMenuItem
                                    onClick={() => setModel("gpt-4o")}
                                    className="cursor-pointer border-0 focus:ring-0 focus:outline-none bg-transparent hover:bg-[#424242] focus:bg-[#424242] text-zinc-100 focus:text-zinc-100 py-3 px-3 rounded-lg flex items-center justify-between group transition-colors mb-1"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/10 p-2 rounded-md group-hover:bg-white/20 transition-colors">
                                            {/* Ícones Sparkles já importados */}
                                            <div className="h-4 w-4 bg-white rounded-full" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">GPT-4o</span>
                                            <span className="text-xs text-zinc-400">Nosso modelo mais inteligente</span>
                                        </div>
                                    </div>
                                    {model === "gpt-4o" && <Check size={16} className="text-white" />}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => setModel("gpt-4o-mini")}
                                    className="cursor-pointer border-0 focus:ring-0 focus:outline-none bg-transparent hover:bg-[#424242] focus:bg-[#424242] text-zinc-100 focus:text-zinc-100 py-3 px-3 rounded-lg flex items-center justify-between group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/10 p-2 rounded-md group-hover:bg-white/20 transition-colors">
                                            <div className="h-4 w-4 bg-zinc-400 rounded-full" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">GPT-4o mini</span>
                                            <span className="text-xs text-zinc-400">Rápido e eficiente</span>
                                        </div>
                                    </div>
                                    {model === "gpt-4o-mini" && <Check size={16} className="text-white" />}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-white/10 my-2" />

                                <DropdownMenuLabel className="text-xs text-zinc-400 font-normal uppercase tracking-wider px-3 py-2">
                                    Meus Agentes
                                </DropdownMenuLabel>

                                <DropdownMenuItem
                                    onClick={handleCreateNewAgent}
                                    className="cursor-pointer border-0 focus:ring-0 focus:outline-none bg-transparent hover:bg-[#424242] focus:bg-[#424242] text-zinc-100 focus:text-zinc-100 py-2 px-3 rounded-lg mb-1 flex items-center gap-3"
                                >
                                    <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center border border-white/5">
                                        <Plus size={16} className="text-white" />
                                    </div>
                                    <span className="text-sm font-medium">Criar Agente Personalizado</span>
                                </DropdownMenuItem>

                                <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {agentsList.map(agent => (
                                        <DropdownMenuItem
                                            key={agent.id}
                                            onClick={() => handleSelectAgent(agent.id)}
                                            className="cursor-pointer border-0 focus:ring-0 focus:outline-none bg-transparent hover:bg-[#424242] focus:bg-[#424242] text-zinc-100 focus:text-zinc-100 py-2 px-3 rounded-lg flex justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {renderAgentIcon(agent.icon || "Bot", "w-6 h-6")}
                                                <span className="text-sm">{agent.name}</span>
                                            </div>
                                            {agentId === agent.id && <div className="h-2 w-2 rounded-full bg-green-500" />}
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {!isRightPanelOpen && (<Button variant="ghost" size="icon" onClick={() => setIsRightPanelOpen(true)} className="text-zinc-400 hover:text-white hover:bg-white/5"><PanelRightClose size={20} className="scale-x-[-1]" /></Button>)}
                </header>

                <div className="flex-1 overflow-y-auto w-full" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-20 select-none">
                            <div className="mb-6 shadow-2xl rounded-full">
                                {/* Aumentei para w-20 h-20 (80px) para ficar mais visível e tirei as bordas brancas */}
                                <div className="w-24 h-24 rounded-full bg-[#171717] border-4 border-[#2f2f2f] flex items-center justify-center overflow-hidden relative">
                                    {renderAgentIcon(agentIcon, "w-full h-full object-cover")}
                                </div>
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-2">Olá, eu sou o {agentName}</h2>
                            <p className="text-zinc-400 mb-8 max-w-md">{agentDesc || "Configure-me no painel à direita."}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-6 px-4 pb-32">
                            {messages.map((msg, index) => (
                                <div key={msg.id || index} className="flex gap-4 text-base group">
                                    <div className={`shrink-0 flex flex-col relative pt-1`}>
                                        {msg.role === 'assistant' ? (
                                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border border-white/10 shadow-sm select-none overflow-hidden">
                                                {renderAgentIcon(agentIcon, "w-full h-full")}
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[#2f2f2f] flex items-center justify-center select-none"><User size={18} className="text-zinc-300" /></div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[90%] w-full">
                                        <div className="font-semibold text-sm text-zinc-300 mb-1 select-none">{msg.role === 'user' ? 'Você' : agentName}</div>
                                        {msg.role === 'assistant' && msg.content.length === 0 ? (
                                            <div className="flex items-center h-7 fade-in-0"><div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" /></div>
                                        ) : (
                                            msg.role === 'assistant' ? (
                                                <div className="w-full">
                                                    <SmoothStream content={msg.content} />
                                                    <div className="flex items-center gap-1 mt-2 text-zinc-500">
                                                        <CopyButton text={msg.content} className="h-7 w-7 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5" />
                                                        <Button variant="ghost" size="icon" onClick={() => reload()} className="h-7 w-7 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5" title="Regenerar"><RotateCcw size={14} /></Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5"><ThumbsUp size={14} /></Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5"><ThumbsDown size={14} /></Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-zinc-100 leading-7 text-[15px] whitespace-pre-wrap">{msg.content}</div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full flex-shrink-0 pb-6 pt-2 bg-[#212121]">
                    <div className="max-w-4xl mx-auto px-4 relative">
                        <div className="relative flex items-end w-full p-3 bg-[#2f2f2f] rounded-[26px] has-[:focus]:bg-[#2f2f2f] has-[:focus]:ring-0 transition-all">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700/50 mb-0.5 mr-2"><Paperclip size={20} /></Button>
                            <textarea ref={textareaRef} className="flex-1 max-h-[200px] min-h-[44px] bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-0 shadow-none text-zinc-100 placeholder:text-zinc-400 resize-none py-2.5 px-0 leading-relaxed scrollbar-hide text-base" placeholder={`Conversar com ${agentName}...`} rows={1} value={input} onChange={handleInputWithResize} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCustomSubmit(); } }} />
                            <Button disabled={!input.trim() || isLoading} onClick={() => handleCustomSubmit()} className={`h-8 w-8 rounded-full transition-all mb-0.5 ml-2 ${input.trim() ? 'bg-white text-black hover:bg-zinc-200' : 'bg-[#676767] text-zinc-900 cursor-not-allowed opacity-50'}`}><Send size={16} /></Button>
                        </div>
                    </div>
                </div>
            </main>

            <AgentSetup isOpen={isRightPanelOpen} onClose={() => setIsRightPanelOpen(false)} agentName={agentName} setAgentName={setAgentName} agentDesc={agentDesc} setAgentDesc={setAgentDesc} systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt} model={model} setModel={setModel} useWeb={useWeb} setUseWeb={setUseWeb} useFiles={useFiles} setUseFiles={setUseFiles} agentIcon={agentIcon} setAgentIcon={setAgentIcon} onCreateNew={handleCreateNewAgent} onSave={handleSaveAgent} isSaving={isSavingAgent} agentsList={agentsList} selectedAgentId={agentId} onSelectAgent={handleSelectAgent} />
        </div>
    );
}