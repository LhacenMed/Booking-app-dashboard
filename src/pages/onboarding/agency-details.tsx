import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Spinner } from "@heroui/react";
import { FiGlobe, FiMapPin, FiMap } from "react-icons/fi";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { Map, GeolocateControl, Marker } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface CompanyInfo {
  name: string;
  logo: File | null;
  latitude: string;
  longitude: string;
  phone: string;
  license: File | null;
}

const CompanyInfoPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "informative" | "success" | "warning" | "danger";
    id: number;
  } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "",
    logo: null,
    latitude: "",
    longitude: "",
    phone: "",
    license: null,
  });

  // Nouakchott, Mauritania coordinates
  const NOUAKCHOTT_COORDS = {
    longitude: -15.9785,
    latitude: 18.0735,
    zoom: 10,
  };

  // Validate coordinates
  const isValidCoordinates = (lat: string, lng: string): boolean => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    return (
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180
    );
  };

  // Get initial map view state
  const getInitialViewState = () => {
    if (
      companyInfo.latitude &&
      companyInfo.longitude &&
      isValidCoordinates(companyInfo.latitude, companyInfo.longitude)
    ) {
      return {
        longitude: parseFloat(companyInfo.longitude),
        latitude: parseFloat(companyInfo.latitude),
        zoom: 12,
      };
    }
    return NOUAKCHOTT_COORDS;
  };

  // Handle show map toggle
  const handleShowMap = () => {
    if (showMap) {
      setShowMap(false);
    } else {
      setShowMap(true);
      // If coordinates are valid, set them as selected location
      if (
        companyInfo.latitude &&
        companyInfo.longitude &&
        isValidCoordinates(companyInfo.latitude, companyInfo.longitude)
      ) {
        setSelectedLocation([
          parseFloat(companyInfo.longitude),
          parseFloat(companyInfo.latitude),
        ]);
      } else {
        // Reset selected location if showing default view
        setSelectedLocation(null);
      }
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification(
        "Geolocation is not supported by your browser",
        "warning"
      );
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCompanyInfo((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setIsGettingLocation(false);
        showNotification("Location updated successfully", "success");
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        showNotification(errorMessage, "danger");
      }
    );
  };

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

  // Handle map click
  const handleMapClick = useCallback(
    (event: { lngLat: { lng: number; lat: number } }) => {
      if (!isPickingLocation) return;

      const { lng, lat } = event.lngLat;
      setSelectedLocation([lng, lat]);
      setCompanyInfo((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
      setIsPickingLocation(false);
      showNotification("Location selected successfully", "success");
    },
    [isPickingLocation]
  );

  // Toggle location picking mode
  const toggleLocationPicking = () => {
    setIsPickingLocation(!isPickingLocation);
  };

  // Update cursor style when picking mode changes
  useEffect(() => {
    const mapContainer = document.querySelector(
      ".maplibregl-canvas-container"
    ) as HTMLElement;
    if (mapContainer) {
      mapContainer.style.cursor = isPickingLocation ? "crosshair" : "grab";
    }
  }, [isPickingLocation]);

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
        location: {
          latitude: companyInfo.latitude,
          longitude: companyInfo.longitude,
        },
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter registered company name"
                />
              </div>

              {/* Location and Phone */}
              <div className="space-y-1">
                <label className="text-sm text-white/60">Location</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    name="latitude"
                    value={companyInfo.latitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                    placeholder="Latitude"
                  />
                  <div className="relative">
                    <input
                      type="text"
                      name="longitude"
                      value={companyInfo.longitude}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                      placeholder="Longitude"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="absolute -top-6 right-0 flex items-center gap-1 text-xs text-white/60 hover:text-white/80 transition-colors disabled:opacity-50"
                    >
                      {isGettingLocation ? (
                        <>
                          <Spinner size="sm" />
                          <span>Getting location...</span>
                        </>
                      ) : (
                        <>
                          <FiMapPin className="w-3 h-3" />
                          <span>Current Location</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleShowMap}
                      className="absolute -top-6 right-50 flex items-center gap-1 text-xs text-white/60 hover:text-white/80 transition-colors disabled:opacity-50"
                    >
                      <FiMap className="w-4 h-4" />
                      {showMap ? "Hide Map" : "Show Map"}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-white/60">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={companyInfo.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                    placeholder="Enter company phone number"
                  />
                </div>
              </div>

              {/* Map Window */}
              {showMap && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-gray-900 rounded-lg w-full max-w-2xl overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-800">
                      <h3 className="text-lg font-ot-medium text-white">
                        Select Location
                      </h3>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={toggleLocationPicking}
                          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                            isPickingLocation
                              ? "bg-blue-500 text-white"
                              : "bg-gray-700 text-white/60 hover:text-white"
                          }`}
                        >
                          <FiMapPin className="w-4 h-4" />
                          {isPickingLocation
                            ? "Picking Location..."
                            : "Pick Location"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMap(false)}
                          className="text-white/60 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="h-[400px] relative">
                      {isPickingLocation && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
                          Click anywhere on the map to select location
                        </div>
                      )}
                      <Map
                        initialViewState={getInitialViewState()}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle="https://tiles.openfreemap.org/styles/bright"
                        onClick={handleMapClick}
                      >
                        <GeolocateControl
                          position="top-left"
                          positionOptions={{
                            enableHighAccuracy: true,
                            timeout: 6000,
                          }}
                          trackUserLocation
                          showUserLocation
                          showAccuracyCircle
                          auto
                        />
                        {selectedLocation && (
                          <Marker
                            longitude={selectedLocation[0]}
                            latitude={selectedLocation[1]}
                          >
                            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2" />
                          </Marker>
                        )}
                      </Map>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Company Logo Upload */}
                <div className="space-y-1">
                  <label className="text-sm text-white/60">Company Logo</label>
                  <div
                    {...getLogoRootProps()}
                    className={`w-full h-[120px] rounded-lg border-2 border-dashed ${
                      isLogoDragActive
                        ? "border-white/40 bg-white/5"
                        : "border-white/10"
                    } flex items-center justify-center cursor-pointer transition-colors`}
                  >
                    <input {...getLogoInputProps()} />
                    {companyInfo.logo ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={URL.createObjectURL(companyInfo.logo)}
                          alt="Preview"
                          className="h-12 w-12 object-contain"
                        />
                        <span className="text-xs text-white/60">
                          {companyInfo.logo.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-8 h-8 text-white/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-white/40 text-xs">
                          Upload company logo
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business License Upload */}
                <div className="space-y-1">
                  <label className="text-sm text-white/60">
                    Business License (Optional)
                  </label>
                  <div
                    {...getLicenseRootProps()}
                    className={`w-full h-[120px] rounded-lg border-2 border-dashed ${
                      isLicenseDragActive
                        ? "border-white/40 bg-white/5"
                        : "border-white/10"
                    } flex items-center justify-center cursor-pointer transition-colors`}
                  >
                    <input {...getLicenseInputProps()} />
                    {companyInfo.license ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-8 h-8 text-white/60"
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
                        <span className="text-xs text-white/60">
                          {companyInfo.license.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-8 h-8 text-white/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-white/40 text-xs">
                          Upload business license
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !companyInfo.name}
                className={`w-full bg-black text-white py-3 rounded-lg font-medium disabled:opacity-50 hover:bg-black/90 transition-colors ${
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
                  "Register Company"
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
