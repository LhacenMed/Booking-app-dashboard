import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";

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
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
      const companyRef = doc(db, "transportation_companies", companyId);
      await updateDoc(companyRef, {
        name: companyInfo.name,
        logo: logoUrl,
        location: companyInfo.location,
        phone: companyInfo.phone,
        businessLicense: licenseUrl,
        updatedAt: new Date(),
      });

      // Navigate to next step
      navigate("/onboarding/bank-info");
    } catch (error) {
      console.error("Error saving company info:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save company information"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-red-50 font-ot">
      <div className="w-full max-w-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <img src="/images/qatalog-logo.svg" alt="Logo" className="h-8" />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-ot ot-semibold mb-2">
              Create your company
            </h1>
            <p className="text-gray-600 font-ot ot-regular">
              Don't worry, you can edit this later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-ot ot-medium text-gray-700">
                  Company Name
                </span>
                <span className="text-xs font-ot ot-regular text-gray-500">
                  press Enter ↵ to submit
                </span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={companyInfo.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-ot ot-regular"
                placeholder="Enter your company name"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-ot ot-medium text-gray-700">
                  Company Logo
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
                      <path d="M12 16v-4m0 0l-2 2m2-2l2 2" />
                    </svg>
                  </button>
                </div>
              </label>
              <div
                {...getLogoRootProps()}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isLogoDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input {...getLogoInputProps()} />
                {companyInfo.logo ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(companyInfo.logo)}
                      alt="Preview"
                      className="h-24 w-24 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm font-ot ot-regular">
                      Drop your logo here or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-ot ot-medium text-gray-700"
              >
                Main Office Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={companyInfo.location}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-ot ot-regular"
                placeholder="Enter your office address"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-ot ot-medium text-gray-700"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={companyInfo.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-ot ot-regular"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Business License */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-ot ot-medium text-gray-700">
                  Business License
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
                      <path d="M12 16v-4m0 0l-2 2m2-2l2 2" />
                    </svg>
                  </button>
                </div>
              </label>
              <div
                {...getLicenseRootProps()}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isLicenseDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input {...getLicenseInputProps()} required />
                {companyInfo.license ? (
                  <div className="flex items-center justify-center text-blue-600 font-ot ot-medium">
                    <svg
                      className="h-8 w-8 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{companyInfo.license.name}</span>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm font-ot ot-regular">
                      Drop your business license here or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-ot ot-regular"
              >
                {error}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading || !companyInfo.name}
                className={`w-full py-3 px-4 rounded-xl text-white font-ot ot-medium ${
                  isLoading || !companyInfo.name
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-black hover:bg-black/90"
                }`}
              >
                {isLoading ? "Creating..." : "Create company"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/onboarding/bank-info")}
                className="w-full mt-4 text-gray-500 hover:text-gray-700 font-ot ot-regular"
              >
                I'll do this later
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPage;
