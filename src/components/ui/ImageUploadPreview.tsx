import React, { useState, useRef } from "react";
import { AdvancedImage } from "@cloudinary/react";
import { cld } from "@/utils/cloudinaryConfig";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

interface ImageUploadPreviewProps {
  onFileSelect: (file: File) => void;
  previewUrl?: string;
  publicId?: string;
  required?: boolean;
  isLoading?: boolean;
}

export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  onFileSelect,
  previewUrl,
  publicId,
  required = false,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    // Create a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call the parent handler
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelection(file);
        e.dataTransfer.clearData();
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      ref={dropRef}
      onClick={handleClick}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative w-32 h-32 border-2 ${
        isDragging
          ? "border-primary border-dashed bg-primary/10"
          : "border-gray-300"
      } rounded-lg overflow-hidden transition-all duration-200 ease-in-out hover:border-primary cursor-pointer`}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : publicId ? (
        <AdvancedImage
          cldImg={cld
            .image(publicId)
            .format("auto")
            .quality("auto")
            .resize(auto().gravity(autoGravity()).width(500).height(500))}
          className="w-full h-full object-cover"
        />
      ) : localPreview ? (
        <img
          src={localPreview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
          <svg
            className="w-8 h-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-gray-500">
            Drag & drop or click to upload
          </p>
          {required && <p className="text-xs text-red-500 mt-1">*Required</p>}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelection(file);
        }}
        className="hidden"
        required={required}
      />
    </div>
  );
};
