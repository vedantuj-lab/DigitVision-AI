import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  X,
  AlertCircle,
  Info,
  Send,
  Crop,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { parseDocumentOrImage, ExtractedMedia } from '../utils/documentParser';

interface ImageUploaderProps {
  onPredict: (dataUrl: string, method: 'upload') => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 25; // Generous 25MB limit for PDFs/Office presentations

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onPredict,
  isLoading,
  disabled = false
}) => {
  const [extractedMediaList, setExtractedMediaList] = useState<ExtractedMedia[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string } | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Crop / Region-of-Interest (ROI) state
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropCurrent, setCropCurrent] = useState<{ x: number; y: number } | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imagePreviewRef = useRef<HTMLImageElement | null>(null);

  const activeMedia = extractedMediaList[selectedIndex] || null;

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setIsParsing(true);
    setCroppedDataUrl(null);
    setIsCropping(false);

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
      setIsParsing(false);
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    try {
      const results = await parseDocumentOrImage(file);
      if (results.length === 0) {
        throw new Error('No images or pages could be extracted from this document.');
      }
      setExtractedMediaList(results);
      setSelectedIndex(0);
      setFileDetails({
        name: file.name,
        size: sizeFormatted,
        type: file.type || file.name.split('.').pop()?.toUpperCase() || 'FILE'
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse file. Please verify file integrity.');
      setExtractedMediaList([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isLoading || isParsing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setExtractedMediaList([]);
    setSelectedIndex(0);
    setFileDetails(null);
    setErrorMessage(null);
    setCroppedDataUrl(null);
    setIsCropping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Crop / ROI Handler
  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !imagePreviewRef.current) return;
    const rect = imagePreviewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setCropStart({ x, y });
    setCropCurrent({ x, y });
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropStart || !imagePreviewRef.current) return;
    const rect = imagePreviewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setCropCurrent({ x, y });
  };

  const handleCropMouseUp = () => {
    if (!isCropping || !cropStart || !cropCurrent || !imagePreviewRef.current || !activeMedia) {
      setCropStart(null);
      setCropCurrent(null);
      return;
    }

    const img = imagePreviewRef.current;
    const rect = img.getBoundingClientRect();

    const x1 = Math.min(cropStart.x, cropCurrent.x);
    const y1 = Math.min(cropStart.y, cropCurrent.y);
    const boxW = Math.abs(cropStart.x - cropCurrent.x);
    const boxH = Math.abs(cropStart.y - cropCurrent.y);

    if (boxW > 10 && boxH > 10) {
      // Create cropped sub-image
      const originalImg = new Image();
      originalImg.src = activeMedia.dataUrl;
      originalImg.onload = () => {
        const scaleX = originalImg.naturalWidth / rect.width;
        const scaleY = originalImg.naturalHeight / rect.height;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = boxW * scaleX;
        cropCanvas.height = boxH * scaleY;
        const ctx = cropCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            originalImg,
            x1 * scaleX,
            y1 * scaleY,
            boxW * scaleX,
            boxH * scaleY,
            0,
            0,
            cropCanvas.width,
            cropCanvas.height
          );
          setCroppedDataUrl(cropCanvas.toDataURL('image/png'));
        }
      };
    }

    setCropStart(null);
    setCropCurrent(null);
  };

  const handleSubmit = () => {
    const targetUrl = croppedDataUrl || activeMedia?.dataUrl;
    if (!targetUrl) return;
    onPredict(targetUrl, 'upload');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[480px]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,application/pdf"
        onChange={handleChange}
        className="hidden"
      />

      {/* Upload Drop Zone when nothing loaded */}
      {extractedMediaList.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full min-h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-lime-400 bg-lime-400/5 scale-[0.99]'
              : 'border-white/10 hover:border-violet-500/50 bg-white/[0.02] hover:bg-white/[0.04]'
          } ${disabled || isParsing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-lime-400">
            {isParsing ? (
              <span className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            {isParsing ? 'Parsing Document...' : 'Upload Image or Document'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
            Drag & drop any file. The system extracts pages and handwritten media automatically.
          </p>

          {/* Supported Format Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/[0.05] px-2 py-1 rounded-md border border-white/5">
              <ImageIcon className="w-3 h-3 text-lime-400" />
              All Images (PNG, JPG, WEBP, SVG)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/[0.05] px-2 py-1 rounded-md border border-white/5">
              <FileText className="w-3 h-3 text-violet-400" />
              PDF Documents
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/[0.05] px-2 py-1 rounded-md border border-white/5">
              <FileText className="w-3 h-3 text-blue-400" />
              Word (.docx)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/[0.05] px-2 py-1 rounded-md border border-white/5">
              <Presentation className="w-3 h-3 text-amber-400" />
              PowerPoint (.pptx)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/[0.05] px-2 py-1 rounded-md border border-white/5">
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              Excel (.xlsx, .csv)
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4">
          {/* Main Inspection View */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black p-2 shadow-2xl w-full flex flex-col items-center">
            {/* Interactive Image or Cropping Container */}
            <div
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              className={`relative overflow-hidden flex items-center justify-center max-h-[340px] max-w-full ${
                isCropping ? 'cursor-crosshair select-none' : ''
              }`}
            >
              <img
                ref={imagePreviewRef}
                src={croppedDataUrl || activeMedia?.dataUrl}
                alt={activeMedia?.name || 'Uploaded document media'}
                className="max-h-[320px] w-auto max-w-full object-contain rounded-xl bg-black"
                draggable={false}
              />

              {/* Crop selection overlay box */}
              {isCropping && cropStart && cropCurrent && (
                <div
                  className="absolute border-2 border-lime-400 bg-lime-400/20 pointer-events-none"
                  style={{
                    left: Math.min(cropStart.x, cropCurrent.x),
                    top: Math.min(cropStart.y, cropCurrent.y),
                    width: Math.abs(cropStart.x - cropCurrent.x),
                    height: Math.abs(cropStart.y - cropCurrent.y)
                  }}
                />
              )}
            </div>

            {/* Quick Action Overlay Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => {
                  if (croppedDataUrl) {
                    setCroppedDataUrl(null);
                  } else {
                    setIsCropping(!isCropping);
                  }
                }}
                className={`p-1.5 rounded-lg backdrop-blur-sm border text-xs font-mono flex items-center gap-1 transition-colors ${
                  croppedDataUrl
                    ? 'bg-amber-500/80 hover:bg-amber-600 text-white border-amber-400/40'
                    : isCropping
                    ? 'bg-lime-400 text-black border-lime-400 font-bold'
                    : 'bg-black/80 hover:bg-white/10 text-white border-white/20'
                }`}
                title={croppedDataUrl ? 'Reset full image' : 'Drag to crop specific digit'}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>{croppedDataUrl ? 'Reset Crop' : isCropping ? 'Select Area' : 'Crop Digit'}</span>
              </button>

              <button
                onClick={handleClear}
                disabled={isLoading}
                className="p-1.5 bg-black/80 hover:bg-rose-500 text-white rounded-lg backdrop-blur-sm border border-white/20 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multi-Page / Multi-Media Carousel (if document has multiple pages or slides) */}
          {extractedMediaList.length > 1 && (
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-violet-400" />
                  <span>
                    Extracted Pages / Media ({selectedIndex + 1} of {extractedMediaList.length})
                  </span>
                </span>
                <span>Click thumbnail to select</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {extractedMediaList.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setCroppedDataUrl(null);
                      setIsCropping(false);
                    }}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border p-0.5 transition-all ${
                      idx === selectedIndex
                        ? 'border-lime-400 ring-2 ring-lime-400/30 scale-105'
                        : 'border-white/10 opacity-60 hover:opacity-100 bg-black'
                    }`}
                  >
                    <img
                      src={m.dataUrl}
                      alt={m.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File Metadata Strip */}
          {fileDetails && (
            <div className="w-full flex items-center justify-between text-xs px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-2 truncate max-w-[260px]">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-400 uppercase">
                  {fileDetails.type}
                </span>
                <span className="text-slate-300 font-mono truncate">{fileDetails.name}</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{fileDetails.size}</span>
            </div>
          )}

          {/* Actions */}
          <div className="w-full flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || disabled}
              className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors"
            >
              Upload Different File
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || disabled}
              className="flex-1 py-2.5 px-3 text-xs font-bold text-black bg-lime-400 hover:bg-lime-300 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg shadow-sm shadow-lime-400/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {croppedDataUrl ? 'Predict Cropped Digit' : 'Predict Selected Digit'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Callout */}
      {errorMessage && (
        <div className="mt-3 w-full flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Guidance Note */}
      <div className="mt-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[11px] text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-200 font-medium">Multi-Format Document Support:</span> Upload images,
          multi-page PDF worksheets, Word docs, PowerPoint presentations, or Excel spreadsheets. Use the{' '}
          <strong className="text-lime-300">Crop Digit</strong> tool to box any isolated digit on a complex document page!
        </div>
      </div>
    </div>
  );
};
