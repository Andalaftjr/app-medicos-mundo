import { useEffect, useRef, useState } from 'react';
import { Camera, FlipHorizontal, Upload, User, X } from 'lucide-react';

export default function PhotoHandler({ onPhotoCaptured, currentPhoto }) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isCameraOpen) return undefined;

    let stream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode } })
      .then((mediaStream) => {
        stream = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch((err) => console.error("Erro camera:", err));

    return () => stream?.getTracks().forEach(track => track.stop());
  }, [isCameraOpen, facingMode]);

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 800, 800);
    onPhotoCaptured(canvasRef.current.toDataURL('image/jpeg', 0.7));
    stopCamera();
  };

  const captureUploadedPhoto = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const outputSize = 800;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const cropSize = Math.min(image.width, image.height);
        canvas.width = outputSize;
        canvas.height = outputSize;
        context.drawImage(
          image,
          (image.width - cropSize) / 2,
          (image.height - cropSize) / 2,
          cropSize,
          cropSize,
          0,
          0,
          outputSize,
          outputSize
        );
        onPhotoCaptured(canvas.toDataURL('image/jpeg', 0.7));
      };
      image.onerror = () => console.error('Nao foi possivel processar a foto enviada.');
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative w-20 h-20 bg-gray-100 rounded-2xl border-2 border-blue-100 shadow-inner overflow-hidden group">
        {currentPhoto ? (
          <img src={currentPhoto} className="w-full h-full object-cover" alt="Avatar" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={30}/></div>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" title="Usar camera" aria-label="Usar camera para foto" onClick={() => setIsCameraOpen(true)} className="p-2 bg-[#292f63] text-white rounded-lg shadow-md active:scale-90"><Camera size={14}/></button>
        <label title="Enviar foto" aria-label="Enviar foto do dispositivo" className="p-2 bg-emerald-600 text-white rounded-lg shadow-md cursor-pointer active:scale-90">
          <Upload size={14}/><input type="file" className="hidden" accept="image/*" onChange={(e) => {
            captureUploadedPhoto(e.target.files[0]);
          }}/>
        </label>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-4">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm rounded-3xl border-2 border-white shadow-2xl mb-4" />
          <div className="flex items-center gap-8 bg-gray-900 px-8 py-4 rounded-full">
            <button type="button" aria-label="Cancelar foto" onClick={stopCamera} className="text-red-400 p-2"><X size={28}/></button>
            <button type="button" aria-label="Capturar foto" onClick={takePhoto} className="p-4 bg-emerald-600 text-white rounded-full border-4 border-white shadow-xl"><Camera size={32}/></button>
            <button type="button" aria-label="Alternar camera" onClick={() => {
              const stream = videoRef.current?.srcObject;
              stream?.getTracks().forEach(track => track.stop());
              setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
            }} className="text-blue-400 p-2"><FlipHorizontal size={28}/></button>
          </div>
          <canvas ref={canvasRef} width="800" height="800" className="hidden" />
        </div>
      )}
    </div>
  );
}
