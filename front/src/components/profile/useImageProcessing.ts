import { useState, useRef } from "react";
import { Crop } from 'react-image-crop';
import { uploadImage as uploadImageService } from '@/api/images';

export const useImageProcessing = (onChange: (value: string) => void, defaultAspectRatio: number = 1) => {
  const [uploading, setUploading] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100 / defaultAspectRatio
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Création d'une image pour obtenir ses dimensions naturelles
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      // Calcul du crop initial en respectant le ratio
      const newCrop: Crop = {
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100 / defaultAspectRatio
      };

      if (aspectRatio > defaultAspectRatio) {
        // L'image est plus large que le ratio cible
        // On réduit la largeur pour respecter le ratio
        newCrop.width = 100 * defaultAspectRatio / aspectRatio;
        newCrop.height = 100;
        newCrop.x = (100 - newCrop.width) / 2;
        newCrop.y = 0;
      } else if (aspectRatio < defaultAspectRatio) {
        // L'image est plus haute que le ratio cible
        // On réduit la hauteur pour respecter le ratio
        newCrop.width = 100;
        newCrop.height = 100 * aspectRatio / defaultAspectRatio;
        newCrop.x = 0;
        newCrop.y = (100 - newCrop.height) / 2;
      } else {
        // L'image a déjà le bon ratio
        newCrop.width = 100;
        newCrop.height = 100;
        newCrop.x = 0;
        newCrop.y = 0;
      }

      setCrop(newCrop);
    };
    img.src = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropDialog(true);
  };

  const getCroppedImg = async (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelCrop = {
      x: (crop.x * image.width * scaleX) / 100,
      y: (crop.y * image.height * scaleY) / 100,
      width: (crop.width * image.width * scaleX) / 100,
      height: (crop.height * image.height * scaleY) / 100,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        resolve(blob);
      }, 'image/jpeg', 1);
    });
  };

  const handleCropComplete = async () => {
    if (!selectedFile || !imgRef.current) return;

    try {
      setUploading(true);

      // S'assurer que l'image est bien chargée
      if (!imgRef.current.complete) {
        await new Promise((resolve) => {
          imgRef.current!.addEventListener('load', resolve);
        });
      }

      const croppedBlob = await getCroppedImg(imgRef.current, crop);
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      // Appel du service d'upload vers le backend
      const response = await uploadImageService(file);
      // Si l'upload est réussi, on récupère l'URL de l'image
      if (response.success) {
        console.log(' === response.url === useImageProcessing.ts === key: 282815 ===');
        console.log(response.url)
        console.log('=================================');
        onChange(response.url);
      } else {
        console.error('Upload failed:', response);
      }
      
      setShowCropDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.log(' === error === useImageProcessing.ts === key: 861383 ===');
      console.log(error)
      console.log('=================================');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    showCropDialog,
    previewUrl,
    crop,
    imgRef,
    setShowCropDialog,
    setCrop,
    handleFileChange,
    handleCropComplete
  };
};
