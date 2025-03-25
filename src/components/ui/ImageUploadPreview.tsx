import React, { useState, useRef } from "react";
import { AdvancedImage } from "@cloudinary/react";
import { cld } from "@/utils/cloudinaryConfig";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

interface ImageUploadPreviewProps {
  onFileSelect: (file: File | null) => void;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    // Create a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Store file information
    setSelectedFile(file);

    // Call the parent handler
    onFileSelect(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(null);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    // Notify parent component that the image was cleared
    onFileSelect(null);
  };

  const hasImage = publicId || localPreview;

  // Get file information with fallbacks
  const getFileInfo = () => {
    if (selectedFile) {
      return {
        name: selectedFile.name,
        type: selectedFile.type.split("/")[1].toUpperCase(),
        size: formatFileSize(selectedFile.size),
      };
    }
    return {
      name: "flower.JPG",
      type: "JPEG",
      size: formatFileSize(0.02 * 1024 * 1024),
    };
  };

  return (
    <div
      ref={dropRef}
      onClick={handleClick}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative w-full aspect-[2/1] border-2 border-dashed ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      } rounded-lg overflow-hidden transition-all duration-200 ease-in-out hover:border-blue-500 cursor-pointer`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`${
            hasImage ? "w-full h-full p-4" : "w-[50%] aspect-square"
          } bg-gray-50 rounded-lg overflow-hidden transition-all duration-300 flex justify-center items-center`}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : hasImage ? (
            <div className="flex items-center h-full gap-4 px-2">
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-white">
                {publicId ? (
                  <AdvancedImage
                    cldImg={cld
                      .image(publicId)
                      .format("auto")
                      .quality("auto")
                      .resize(auto().gravity(autoGravity()))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={localPreview!}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm mb-0.5 truncate">
                  {getFileInfo().name}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{getFileInfo().type}</span>
                  <span className="text-gray-300">•</span>
                  <span>{getFileInfo().size}</span>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Remove image"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L13 13M1 13L13 1"
                    stroke="#666666"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <svg
                className="w-8 h-8 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-600">
                Upload {required ? "" : "business license"}
              </p>
            </div>
          )}
        </div>
      </div>
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
