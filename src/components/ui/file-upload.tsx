import { cn } from "@/lib/utils";
import React, { useRef, useState, useId } from "react";
import { motion } from "motion/react";
// import { IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export interface FileUploadProps {
  onChange?: (files: File[]) => void;
  type: "logo" | "license";
  setCompanyData: (prev: any) => void;
  initialPreview?: string;
  label?: string;
  description?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onChange,
  type,
  setCompanyData,
  initialPreview,
  label = "Upload file",
  description = "Drag and drop your file here or click to upload",
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "booking-app");
      formData.append("cloud_name", "dwctkor2s");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwctkor2s/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("Cloudinary error response:", data);
        throw new Error(
          data.error?.message || `Upload failed: ${response.statusText}`
        );
      }

      if (data.public_id && data.secure_url) {
        // Update company data based on upload type
        if (type === "logo") {
          setCompanyData((prev: any) => ({
            ...prev,
            logoPublicId: data.public_id,
            logoUrl: data.secure_url,
          }));
        } else {
          setCompanyData((prev: any) => ({
            ...prev,
            businessLicensePublicId: data.public_id,
            businessLicenseUrl: data.secure_url,
          }));
        }
      } else {
        throw new Error(
          `Missing public_id or secure_url in response for ${type} upload`
        );
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setError(
        error instanceof Error
          ? error.message
          : `Error uploading ${type}. Please try again.`
      );
      throw error; // Re-throw to trigger the catch block in handleFileChange
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (newFiles: File[]) => {
    const fileToAdd = newFiles[0];
    if (fileToAdd) {
      // Validate file type and size first
      if (!fileToAdd.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (fileToAdd.size > maxSize) {
        setError("File size should be less than 5MB");
        return;
      }

      try {
        setIsLoading(true);
        // Create preview before upload attempt
        const objectUrl = URL.createObjectURL(fileToAdd);
        setPreview(objectUrl);
        setFiles([fileToAdd]);
        onChange && onChange([fileToAdd]);

        await handleFileUpload(fileToAdd);
      } catch (error) {
        // If upload fails, clear the preview and file state
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
        setFiles([]);
        onChange && onChange([]);

        // Also clear the respective company data fields
        if (type === "logo") {
          setCompanyData((prev: any) => ({
            ...prev,
            logoPublicId: "",
            logoUrl: "",
          }));
        } else {
          setCompanyData((prev: any) => ({
            ...prev,
            businessLicensePublicId: "",
            businessLicenseUrl: "",
          }));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUnselectFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setFiles([]);
    onChange && onChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear the respective company data fields based on type
    if (type === "logo") {
      setCompanyData((prev: any) => ({
        ...prev,
        logoPublicId: "",
        logoUrl: "",
      }));
    } else {
      setCompanyData((prev: any) => ({
        ...prev,
        businessLicensePublicId: "",
        businessLicenseUrl: "",
      }));
    }
  };

  // Clean up preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (preview && !initialPreview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, initialPreview]);

  const handleClick = () => {
    if (files.length === 0) {
      // Only allow clicking if no file is selected
      fileInputRef.current?.click();
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
      setError("File upload rejected. Please check file type and size.");
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className={cn(
          "p-10 group/file block rounded-lg w-full relative overflow-hidden",
          files.length === 0 ? "cursor-pointer" : "cursor-default"
        )}
      >
        <input
          ref={fileInputRef}
          id={`file-upload-${uniqueId}`}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            {label}
          </p>
          {error && (
            <p className="relative z-20 font-sans text-sm text-red-500 mt-1">
              {error}
            </p>
          )}
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            {files.length === 0 ? description : "File selected"}
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={`${uniqueId}-file-${idx}`}
                  layoutId={`file-upload-${uniqueId}`}
                  className={cn(
                    "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex items-start justify-between md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {preview && (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between w-full items-center gap-4">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                          className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                        >
                          {file.name}
                        </motion.p>
                        <div className="flex items-center gap-2">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                          >
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </motion.p>
                          <button
                            onClick={handleUnselectFile}
                            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            {/* <IconX className="h-4 w-4 text-neutral-500" /> */}
                          </button>
                        </div>
                      </div>

                      <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                          className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800"
                        >
                          {file.type}
                        </motion.p>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                        >
                          modified{" "}
                          {new Date(file.lastModified).toLocaleDateString()}
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId={`file-upload-${uniqueId}`}
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-neutral-600 flex flex-col items-center"
                  >
                    Drop it
                    {/* <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" /> */}
                  </motion.p>
                ) : (
                  // <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                  <p>Upload</p>
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
