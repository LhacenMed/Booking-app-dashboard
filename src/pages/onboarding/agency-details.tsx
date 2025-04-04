import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Spinner } from "@heroui/react";
import { FiGlobe } from "react-icons/fi";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { PageTransition } from "@/components/ui/PageTransition";

interface CompanyInfo {
  name: string;
  logo: File | null;
  location: string;
  phone: string;
  license: File | null;
}

const CompanyInfoPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "informative" | "success" | "warning" | "danger";
    id: number;
  } | null>(null);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "",
    logo: null,
    location: "",
    phone: "",
    license: null,
  });

  // Logo dropzone
  const onLogoDropAccepted = useCallback((acceptedFiles: File[]) => {
    setCompanyInfo((prev) => ({
      ...prev,
      logo: acceptedFiles[0],
    }));
  }, []);

  const {
    getRootProps: getLogoRootProps,
    getInputProps: getLogoInputProps,
    isDragActive: isLogoDragActive,
  } = useDropzone({
    onDropAccepted: onLogoDropAccepted,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
    multiple: false,
  });

  // License dropzone
  const onLicenseDropAccepted = useCallback((acceptedFiles: File[]) => {
    setCompanyInfo((prev) => ({
      ...prev,
      license: acceptedFiles[0],
    }));
  }, []);

  const {
    getRootProps: getLicenseRootProps,
    getInputProps: getLicenseInputProps,
    isDragActive: isLicenseDragActive,
  } = useDropzone({
    onDropAccepted: onLicenseDropAccepted,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showNotification = (
    message: string,
    type: "informative" | "success" | "warning" | "danger"
  ) => {
    const id = Date.now();
    setNotification({
      message,
      type,
      id,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get company ID from localStorage
      const companyId = localStorage.getItem("signupUID");
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Upload logo to Cloudinary if exists
      let logoUrl = "";
      if (companyInfo.logo) {
        const formData = new FormData();
        formData.append("file", companyInfo.logo);
        formData.append("upload_preset", "company_logos");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/your-cloud-name/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        logoUrl = data.secure_url;
      }

      // Upload license to Cloudinary if exists
      let licenseUrl = "";
      if (companyInfo.license) {
        const formData = new FormData();
        formData.append("file", companyInfo.license);
        formData.append("upload_preset", "business_licenses");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/your-cloud-name/raw/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        licenseUrl = data.secure_url;
      }

      // Update company document in Firestore
      const companyRef = doc(db, "agencies", companyId);
      await updateDoc(companyRef, {
        name: companyInfo.name,
        logo: logoUrl,
        location: companyInfo.location,
        phone: companyInfo.phone,
        businessLicense: licenseUrl,
        updatedAt: new Date(),
      });

      showNotification("Company information updated successfully", "success");
      navigate("/onboarding/bank-info");
    } catch (error) {
      console.error("Error saving company info:", error);
      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to save company information",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout notification={notification}>
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <FiGlobe className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-ot-medium text-white">
                Company Details
              </h1>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                Tell us about your company
              </a>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-sm text-white/60">Company Name</label>
                <input
                  type="text"
                  name="name"
                  value={companyInfo.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                  placeholder="Enter your company name"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-1">
                <label className="text-sm text-white/60">Company Logo</label>
                <div
                  {...getLogoRootProps()}
                  className={`w-full px-3 py-4 rounded-lg border border-dashed ${
                    isLogoDragActive
                      ? "border-white/40 bg-white/5"
                      : "border-white/10"
                  } text-center cursor-pointer transition-colors`}
                >
                  <input {...getLogoInputProps()} />
                  {companyInfo.logo ? (
                    <div className="flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(companyInfo.logo)}
                        alt="Preview"
                        className="h-16 w-16 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">
                      Drop your logo here or click to browse
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-sm text-white/60">Office Location</label>
                <input
                  type="text"
                  name="location"
                  value={companyInfo.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                  placeholder="Enter your office address"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-sm text-white/60">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={companyInfo.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* License Upload */}
              <div className="space-y-1">
                <label className="text-sm text-white/60">
                  Business License
                </label>
                <div
                  {...getLicenseRootProps()}
                  className={`w-full px-3 py-4 rounded-lg border border-dashed ${
                    isLicenseDragActive
                      ? "border-white/40 bg-white/5"
                      : "border-white/10"
                  } text-center cursor-pointer transition-colors`}
                >
                  <input {...getLicenseInputProps()} />
                  {companyInfo.license ? (
                    <p className="text-white/80 text-sm">
                      {companyInfo.license.name}
                    </p>
                  ) : (
                    <p className="text-white/40 text-sm">
                      Drop your business license here or click to browse
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !companyInfo.name}
                className={`w-full bg-white text-black py-3 rounded-lg font-medium disabled:opacity-50 hover:bg-white/90 transition-colors ${
                  isLoading || !companyInfo.name
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Continue"
                )}
              </button>

              {/* Skip Link */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/onboarding/bank-info")}
                  className="text-white/60 hover:text-white/80 hover:underline transition-colors text-sm"
                >
                  I'll do this later
                </button>
              </div>
            </form>
          </div>
        </div>
      </PageTransition>
    </OnboardingLayout>
  );
};

export default CompanyInfoPage;
