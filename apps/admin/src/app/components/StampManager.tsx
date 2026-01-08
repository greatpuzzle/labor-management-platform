import * as React from "react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog"
import { Loader2, Trash2, Upload, Stamp, CircleAlert } from "lucide-react"

interface StampManagerProps {
  isOpen: boolean
  onClose: () => void
  stampImage: string | null
  setStampImage: (image: string | null) => void
}

export function StampManager({ isOpen, onClose, stampImage, setStampImage }: StampManagerProps) {
  const [tempStampImage, setTempStampImage] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Sync temp state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempStampImage(stampImage)
    }
  }, [isOpen, stampImage])

  const removeBackground = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const threshold = 200; // RGB threshold for white detection

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r > threshold && g > threshold && b > threshold) {
            data[i + 3] = 0; // Transparent
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.src = imageSrc;
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsProcessing(true)
      const imageUrl = URL.createObjectURL(file)
      
      try {
        const processedImageUrl = await removeBackground(imageUrl)
        setTempStampImage(processedImageUrl)
      } catch (error) {
        console.error("Image processing failed", error)
        setTempStampImage(imageUrl) 
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleSaveStamp = () => {
    setStampImage(tempStampImage)
    onClose()
  }

  const handleRemoveStamp = () => {
    setTempStampImage(null)
    if (fileInputRef.current) {
        fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
          <DialogHeader>
              <DialogTitle>회사 직인 관리</DialogTitle>
              <DialogDescription>
                  계약서에 사용할 회사의 직인을 등록하세요.
              </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 py-4">
              {/* Preview Area */}
              <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50">
                  {isProcessing ? (
                          <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                              <span className="text-sm">이미지 처리 중...</span>
                          </div>
                  ) : tempStampImage ? (
                      <div className="relative group">
                          <div className="w-32 h-32 bg-white rounded-full border shadow-sm flex items-center justify-center relative overflow-hidden">
                                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20"></div>
                                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300 p-4 text-center pointer-events-none">
                                  계약서 배경 예시
                                  </div>
                                  
                                  <img 
                                  src={tempStampImage} 
                                  alt="Stamp Preview" 
                                  className="w-24 h-24 object-contain mix-blend-multiply opacity-95 contrast-125 rotate-[-5deg]" 
                                  />
                          </div>
                          <Button 
                              size="icon" 
                              variant="destructive" 
                              className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={handleRemoveStamp}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                              <Stamp className="h-8 w-8 text-slate-300" />
                          </div>
                          <span className="text-sm">등록된 직인이 없습니다</span>
                      </div>
                  )}
                  
                  <div className="flex gap-2">
                          <Button variant="secondary" size="sm" className="relative overflow-hidden" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                          <Upload className="mr-2 h-3.5 w-3.5" />
                          이미지 업로드
                          <input 
                              type="file" 
                              ref={fileInputRef}
                              className="hidden" 
                              accept="image/png, image/jpeg, image/jpg"
                              onChange={handleFileChange}
                          />
                          </Button>
                  </div>
              </div>
              
              <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-md flex items-start gap-2">
                      <CircleAlert className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                      <span>
                      <strong>팁:</strong> 흰색 배경에 찍힌 빨간색 도장 이미지를 업로드하면 자동으로 배경을 제거합니다.
                      </span>
              </div>
          </div>

          <DialogFooter>
              <Button variant="ghost" onClick={onClose}>취소</Button>
              <Button onClick={handleSaveStamp} disabled={(!tempStampImage && !stampImage) || isProcessing}>
                  저장하기
              </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
