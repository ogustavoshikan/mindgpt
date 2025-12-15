import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // <--- Mudamos para o Dialog padrão que você já tem
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteDialog({ isOpen, onOpenChange, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#171717] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tem certeza absoluta?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o histórico desta conversa dos nossos servidores.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="bg-transparent border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            Sim, apagar conversa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}