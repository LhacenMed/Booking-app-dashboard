import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
import { db } from "@/config/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Spinner } from "@heroui/react";
import { FiGlobe, FiMapPin, FiMap } from "react-icons/fi";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { Map, GeolocateControl, Marker } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAuth } from "@/hooks/useAuth";
import { ImageUploadPreview } from "@/components/ui/ImageUploadPreview";

interface CompanyInfo {
  name: string;
  logo: File | null;
  logoUrl: string;
  logoPublicId: string;
  latitude: string;
  longitude: string;
  phone: string;
  license: File | null;
  licenseUrl: string;
  licensePublicId: string;
}

const CompanyInfoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isFetchingAgencyData, setIsFetchingAgencyData] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
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
    logoUrl: "",
    logoPublicId: "",
    latitude: "",
    longitude: "",
    phone: "",
    license: null,
    licenseUrl: "",
    licensePublicId: "",
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

  // Fetch current agency data when component loads
  useEffect(() => {
    const fetchAgencyData = async () => {
      if (!user || !user.uid) return;

      try {
        setIsFetchingAgencyData(true);
        const agencyRef = doc(db, "agencies", user.uid);
        const agencyDoc = await getDoc(agencyRef);

        if (agencyDoc.exists()) {
          const data = agencyDoc.data();
          setCompanyInfo((prev) => ({
            ...prev,
            name: data.name || "",
            // Load existing logo data if available
            logoUrl: data.logo?.url || "",
            logoPublicId: data.logo?.publicId || "",
            // Load location data
            latitude: data.location?.latitude || "",
            longitude: data.location?.longitude || "",
            phone: data.phone || "",
            // Load existing license data if available
            licenseUrl: data.businessLicense?.url || "",
            licensePublicId: data.businessLicense?.publicId || "",
          }));

          // If we have valid coordinates, set the selected location for the map
          if (data.location?.latitude && data.location?.longitude) {
            setSelectedLocation([
              parseFloat(data.location.longitude),
              parseFloat(data.location.latitude),
            ]);
          }

          // showNotification("Agency data loaded successfully", "success");
        }
      } catch (error) {
        console.error("Error fetching agency data:", error);
        showNotification("Failed to load agency data", "warning");
      } finally {
        setIsFetchingAgencyData(false);
      }
    };

    fetchAgencyData();
  }, [user]);

  // Handle file upload to Cloudinary
  const handleFileUpload = async (
    file: File | null,
    type: "logo" | "license"
  ) => {
    if (!file) {
      // Clear the relevant image data
      if (type === "logo") {
        // Reset logo data to empty values - will be stored as null in Firestore
        setCompanyInfo((prev) => ({ ...prev, logoPublicId: "", logoUrl: "" }));
      } else {
        // Reset license data to empty values - will be stored as null in Firestore
        setCompanyInfo((prev) => ({
          ...prev,
          licensePublicId: "",
          licenseUrl: "",
        }));
      }
      return;
    }

    try {
      // Set loading state based on file type
      if (type === "logo") {
        setIsUploadingLogo(true);
      } else {
        setIsUploadingLicense(true);
      }

      setNotification(null);

      // Validate file type
      if (!file.type.startsWith("image/") && type === "logo") {
        showNotification("Please upload an image file for logo", "warning");
        return;
      }

      // For license, allow PDF or images
      if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("application/pdf") &&
        type === "license"
      ) {
        showNotification(
          "Please upload an image or PDF file for license",
          "warning"
        );
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showNotification("File size should be less than 5MB", "warning");
        return;
      }

      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "booking-app");
      formData.append("cloud_name", "dwctkor2s");

      // Determine upload endpoint based on file type
      const uploadEndpoint = file.type.startsWith("image/")
        ? "https://api.cloudinary.com/v1_1/dwctkor2s/image/upload"
        : "https://api.cloudinary.com/v1_1/dwctkor2s/raw/upload";

      // Upload to Cloudinary
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Upload failed: ${response.statusText}`
        );
      }

      // Update state with upload results
      if (data.public_id && data.secure_url) {
        if (type === "logo") {
          // Store logo URL and publicId to eventually be saved as a logo object in Firestore
          setCompanyInfo((prev) => ({
            ...prev,
            logo: file, // Keep the file reference for UI preview
            logoPublicId: data.public_id,
            logoUrl: data.secure_url,
          }));
          showNotification("Logo uploaded successfully", "success");
        } else {
          // Store license URL and publicId to eventually be saved as a businessLicense object in Firestore
          setCompanyInfo((prev) => ({
            ...prev,
            license: file, // Keep the file reference for UI preview
            licensePublicId: data.public_id,
            licenseUrl: data.secure_url,
          }));
          showNotification("License uploaded successfully", "success");
        }
      }
    } catch (error) {
      showNotification(
        error instanceof Error
          ? error.message
          : "Error uploading file. Please try again.",
        "danger"
      );
    } finally {
      // Clear loading state
      if (type === "logo") {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingLicense(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get user ID from auth context instead of localStorage
      if (!user || !user.uid) {
        throw new Error("You must be logged in to update agency details");
      }

      const agencyId = user.uid;

      // Prepare logo object if logo URL exists
      const logoObject = companyInfo.logoUrl
        ? {
            url: companyInfo.logoUrl,
            publicId: companyInfo.logoPublicId,
          }
        : null;

      // Prepare license object if license URL exists
      const licenseObject = companyInfo.licenseUrl
        ? {
            url: companyInfo.licenseUrl,
            publicId: companyInfo.licensePublicId,
          }
        : null;

      // Update agency document in Firestore using the user's ID
      const agencyRef = doc(db, "agencies", agencyId);
      await updateDoc(agencyRef, {
        name: companyInfo.name,
        logo: logoObject, // Store as an object with url and publicId
        location: {
          latitude: companyInfo.latitude,
          longitude: companyInfo.longitude,
        },
        phone: companyInfo.phone,
        businessLicense: licenseObject, // Store as an object with url and publicId
        updatedAt: new Date(),
      });

      showNotification("Agency information updated successfully", "success");
      navigate("/onboarding/staff");
    } catch (error) {
      console.error("Error saving agency info:", error);
      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to save agency information",
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
                Agency Details
              </h1>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                Tell us about your agency
              </a>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isFetchingAgencyData ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Spinner size="md" className="mb-4" />
                  <p className="text-white/60">Loading agency data...</p>
                </div>
              ) : (
                <>
                  {/* Company Name */}
                  <div className="space-y-1">
                    <label className="text-sm text-white/60">Agency Name</label>
                    <input
                      type="text"
                      name="name"
                      value={companyInfo.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                      placeholder="Enter registered agency name"
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
                      <label className="text-sm text-white/60">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={companyInfo.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                        placeholder="Enter agency phone number"
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
                      <label className="text-sm text-white/60">
                        Agency Logo
                      </label>
                      <ImageUploadPreview
                        onFileSelect={(file) => handleFileUpload(file, "logo")}
                        previewUrl={companyInfo.logoUrl}
                        publicId={companyInfo.logoPublicId}
                        required={true}
                        isLoading={isUploadingLogo}
                      />
                    </div>

                    {/* Business License Upload */}
                    <div className="space-y-1">
                      <label className="text-sm text-white/60">
                        Business License (Optional)
                      </label>
                      <ImageUploadPreview
                        onFileSelect={(file) =>
                          handleFileUpload(file, "license")
                        }
                        previewUrl={companyInfo.licenseUrl}
                        publicId={companyInfo.licensePublicId}
                        required={false}
                        isLoading={isUploadingLicense}
                      />
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
                      "Save Agency Details"
                    )}
                  </button>

                  {/* Skip Link */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => navigate("/onboarding/staff")}
                      className="text-white/60 hover:text-white/80 hover:underline transition-colors text-sm"
                    >
                      I'll do this later
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </PageTransition>
    </OnboardingLayout>
  );
};

export default CompanyInfoPage;
