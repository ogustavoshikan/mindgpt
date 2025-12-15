"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase"; // Certifique-se que este arquivo existe (criamos no começo)
import { Bot, LogIn } from "lucide-react";

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ isOpen, onOpenChange }: LoginDialogProps) {
  const supabase = createClient();

  const handleLogin = async () => {
    // Para simplificar, vamos usar login via Google
    // Certifique-se de ter ativado o Google Provider no Supabase Authentication
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#171717] border-white/10 text-white">
        <DialogHeader>
          <div className="mx-auto bg-white/10 p-3 rounded-full w-fit mb-4">
             <Bot size={32} className="text-white" />
          </div>
          <DialogTitle className="text-center text-xl">Entre no MindGPT</DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Para salvar seus Agentes e conversas, precisamos saber quem você é.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button 
            onClick={handleLogin}
            className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-11"
          >
            <LogIn className="mr-2 h-4 w-4" /> Entrar com Google
          </Button>
          <p className="text-xs text-center text-zinc-500">
            Ao continuar, você concorda com nosso modo de criação.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}