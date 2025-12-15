import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider" // Certifique-se de ter o Slider, senão usamos input range
import { getCroppedImg } from "@/lib/crop-utils"

interface ImageCropperProps {
  imageSrc: string | null
  onClose: () => void
  onCropComplete: (croppedBlob: Blob) => void
}

export function ImageCropper({ imageSrc, onClose, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const onCropChange = (crop: { x: number; y: number }) => setCrop(crop)
  const onZoomChange = (zoom: number) => setZoom(zoom)

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setLoading(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedBlob) {
        onCropComplete(croppedBlob)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!imageSrc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#171717] border-white/10 text-white sm:max-w-[500px] h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajustar Imagem</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 w-full bg-black rounded-md overflow-hidden my-4 border border-white/10">
           {/* Área de Corte */}
           {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // Força quadrado (1:1)
                onCropChange={onCropChange}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={onZoomChange}
                showGrid={false}
                cropShape="round" // Mostra círculo para visualizar melhor
              />
           )}
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400">Zoom</span>
              {/* Slider simples caso não tenha o componente do shadcn instalado */}
              <input 
                type="range" 
                min={1} max={3} step={0.1} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#FF5500] h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
           </div>

           <DialogFooter>
             <Button variant="ghost" onClick={onClose} className="hover:bg-white/10 text-zinc-300">Cancelar</Button>
             <Button onClick={handleSave} disabled={loading} className="bg-[#FF5500] hover:bg-[#FF5500]/90 text-white">
                {loading ? "Processando..." : "Confirmar Corte"}
             </Button>
           </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}