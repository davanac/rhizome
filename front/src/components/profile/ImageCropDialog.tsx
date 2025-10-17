import ReactCrop, { Crop } from 'react-image-crop';
import { Button } from "@/components/ui/button";
import { Crop as CropIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string | null;
  crop: Crop;
  onCropChange: (crop: Crop) => void;
  onConfirm: () => void;
  uploading: boolean;
  aspectRatio: number;
  imgRef: React.RefObject<HTMLImageElement>;
}

export const ImageCropDialog = ({
  open,
  onOpenChange,
  previewUrl,
  crop,
  onCropChange,
  onConfirm,
  uploading,
  aspectRatio,
  imgRef,
}: ImageCropDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Recadrer l'image</DialogTitle>
        </DialogHeader>
        
        {previewUrl && (
          <div className="mt-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => onCropChange(percentCrop)}
              keepSelection
              minWidth={100}
              minHeight={100}
              aspect={aspectRatio}
              className="max-h-[500px]"
            >
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
              />
            </ReactCrop>
          </div>
        )}

        <DialogFooter className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={uploading}
          >
            <CropIcon className="h-4 w-4 mr-2" />
            {uploading ? "Upload en cours..." : "Valider et uploader"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};