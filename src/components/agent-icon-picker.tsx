"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bot, Pencil, Upload, Brain, Code, Rocket, Sparkles, MessageSquare, Zap, Ghost, Smile
} from "lucide-react";
import { ImageCropper } from "@/components/image-cropper";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

export const ICON_MAP: Record<string, any> = {
    Bot, Brain, Code, Rocket, Sparkles, MessageSquare, Zap, Ghost, Smile
};

interface AgentIconPickerProps {
    agentIcon: string;
    setAgentIcon: (v: string) => void;
}

export function AgentIconPicker({ agentIcon, setAgentIcon }: AgentIconPickerProps) {
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileForCrop, setSelectedFileForCrop] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const isUrl = agentIcon.startsWith("http");
    const CurrentIcon = !isUrl ? (ICON_MAP[agentIcon] || Bot) : null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
  
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setSelectedFileForCrop(reader.result?.toString() || null);
        });
        reader.readAsDataURL(file);
        e.target.value = ''; 
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setSelectedFileForCrop(null);
        setIsUploading(true);
  
        try {
            const fileExt = "jpg";
            const fileName = `${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, croppedBlob);
            
            if (uploadError) throw uploadError;
  
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setAgentIcon(publicUrl);
            toast.success("Imagem atualizada!");
        } catch (error: any) {
            toast.error("Erro no upload", { description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
        {selectedFileForCrop && (
            <ImageCropper 
                imageSrc={selectedFileForCrop} 
                onClose={() => setSelectedFileForCrop(null)} 
                onCropComplete={handleCropComplete} 
            />
        )}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center shadow-lg border-4 border-[#171717] ring-1 ring-white/10 relative group cursor-pointer transition-transform hover:scale-105 overflow-hidden">
                    {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : isUrl ? (
                        <img src={agentIcon} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        CurrentIcon && <CurrentIcon size={40} className="text-white" />
                    )}
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil size={18} className="text-white" />
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#212121] border-white/10 p-2 w-64 min-w-0">
                <div className="grid grid-cols-4 gap-2 mb-2">
                    {Object.keys(ICON_MAP).map((iconKey) => {
                        const IconComp = ICON_MAP[iconKey];
                        return (
                            <div key={iconKey} onClick={() => setAgentIcon(iconKey)} className={`h-10 w-10 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors ${agentIcon === iconKey ? 'bg-white/20 text-white' : 'text-zinc-400'}`}>
                                <IconComp size={20} />
                            </div>
                        )
                    })}
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                    <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-full text-xs h-8 text-zinc-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2">
                        <Upload size={14} /> Upload Imagem
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
        </>
    );
}
