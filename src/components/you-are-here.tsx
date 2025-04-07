import { useRef, useState, useEffect } from "react";
import { Marker, Popup, useMap } from "@vis.gl/react-maplibre";
import type maplibregl from "maplibre-gl";

interface LocationDetails {
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
}

export default function YouAreHere() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationDetails, setLocationDetails] =
    useState<LocationDetails | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLat, setSearchLat] = useState("");
  const [searchLng, setSearchLng] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!isPickingLocation) return;

      const { lng, lat } = e.lngLat;
      setLocation([lng, lat]);
      setAccuracy(null);
      setSearchLat(lat.toFixed(6));
      setSearchLng(lng.toFixed(6));
      fetchLocationDetails(lat, lng);
      setIsPickingLocation(false);
      map.getCanvas().style.cursor = "grab";
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isPickingLocation]);

  useEffect(() => {
    if (!map) return;
    map.getCanvas().style.cursor = isPickingLocation ? "crosshair" : "grab";
  }, [map, isPickingLocation]);

  const validateCoordinates = (lat: string, lng: string): boolean => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      setSearchError("Please enter valid numbers");
      return false;
    }

    if (latNum < -90 || latNum > 90) {
      setSearchError("Latitude must be between -90 and 90");
      return false;
    }

    if (lngNum < -180 || lngNum > 180) {
      setSearchError("Longitude must be between -180 and 180");
      return false;
    }

    setSearchError(null);
    return true;
  };

  const handleSearch = () => {
    if (!validateCoordinates(searchLat, searchLng)) return;

    const lat = parseFloat(searchLat);
    const lng = parseFloat(searchLng);
    console.log("Search coordinates:", lat, lng);

    setLocation([lng, lat]);
    setAccuracy(null);

    fetchLocationDetails(lat, lng);

    map?.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 2000,
    });
  };

  const toggleLocationPicking = () => {
    setIsPickingLocation(!isPickingLocation);
    if (!isPickingLocation) {
      setError(null);
      setSearchError(null);
    }
  };

  const fetchLocationDetails = async (lat: number, lon: number) => {
    console.log("Fetching location details for:", lat, lon);
    setIsLoading(true);
    setLocationDetails(null);
    setError(null);

    try {
      // First try to get location from coordinates
      const response = await fetch(
        `http://ip-api.com/json?lat=${lat}&lon=${lon}`
      );
      console.log("API Response:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Location data received:", data);

      if (data.status === "success") {
        setLocationDetails({
          country: data.country,
          countryCode: data.countryCode,
          region: data.region,
          regionName: data.regionName,
          city: data.city,
          zip: data.zip,
        });
      } else {
        // If coordinate lookup fails, try IP-based lookup
        await fetchLocationFromIP();
      }
    } catch (error) {
      console.error("Error fetching location details:", error);
      // If coordinate lookup fails, try IP-based lookup
      await fetchLocationFromIP();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocationFromIP = async () => {
    try {
      const response = await fetch("http://ip-api.com/json");
      const data = await response.json();
      console.log("IP location data received:", data);

      if (data.status === "success") {
        setLocationDetails({
          country: data.country,
          countryCode: data.countryCode,
          region: data.region,
          regionName: data.regionName,
          city: data.city,
          zip: data.zip,
        });

        // Update location and search fields with IP-based coordinates
        if (data.lat && data.lon) {
          setLocation([data.lon, data.lat]);
          setSearchLat(data.lat.toFixed(6));
          setSearchLng(data.lon.toFixed(6));

          // Center map on IP location
          map?.flyTo({
            center: [data.lon, data.lat],
            zoom: 12,
            duration: 2000,
          });
        }
      } else {
        setError("Could not fetch location from IP");
        setLocationDetails(null);
      }
    } catch (error) {
      console.error("Error fetching IP location:", error);
      setError("Failed to fetch location from IP");
      setLocationDetails(null);
    }
  };

  // Add useEffect to fetch IP location on component mount
  useEffect(() => {
    fetchLocationFromIP();
  }, []);

  if (!map) return null;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          zIndex: 1000,
          width: "320px",
        }}
      >
        <div
          style={{
            marginBottom: "15px",
            fontSize: "16px",
            fontWeight: "600",
            color: "#333",
          }}
        >
          Location Selection
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Latitude"
            value={searchLat}
            onChange={(e) => setSearchLat(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
              width: "100%",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <input
            type="text"
            placeholder="Longitude"
            value={searchLng}
            onChange={(e) => setSearchLng(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
              width: "100%",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 12px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              width: "100%",
              transition: "background-color 0.2s",
            }}
          >
            Search
          </button>
          <button
            onClick={toggleLocationPicking}
            style={{
              padding: "8px 12px",
              backgroundColor: isPickingLocation ? "#6c757d" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background-color 0.2s",
            }}
          >
            {isPickingLocation ? "✓ Pick Location" : "📍 Pick Location"}
          </button>
        </div>

        {isTracking && (
          <div style={{ marginBottom: "10px" }}>
            <button
              onClick={() => {
                setIsTracking(false);
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "background-color 0.2s",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "18px" }}>⊗</span> Stop Tracking
              </span>
            </button>
          </div>
        )}

        {searchError && (
          <div
            style={{
              color: "#dc3545",
              fontSize: "13px",
              marginTop: "8px",
              padding: "8px",
              backgroundColor: "rgba(220, 53, 69, 0.1)",
              borderRadius: "4px",
            }}
          >
            {searchError}
          </div>
        )}

        {isPickingLocation && (
          <div
            style={{
              color: "#28a745",
              fontSize: "13px",
              marginTop: "8px",
              padding: "8px",
              backgroundColor: "rgba(40, 167, 69, 0.1)",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            Click anywhere on the map to select location
          </div>
        )}
      </div>

      {(location || error) && (
        <>
          {location && (
            <>
              <Marker longitude={location[0]} latitude={location[1]}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    background: "#007bff",
                    border: "3px solid white",
                    borderRadius: "50%",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }}
                />
              </Marker>
              <Popup
                longitude={location[0]}
                latitude={location[1]}
                closeButton={false}
                offset={[0, -15]}
              >
                <div
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Location Details
                  </h3>
                  <div
                    style={{
                      margin: "5px 0",
                      color: "#555",
                      lineHeight: "1.4",
                    }}
                  >
                    Lat: {location[1].toFixed(6)}
                    <br />
                    Lng: {location[0].toFixed(6)}
                    <br />
                    {accuracy && (
                      <>
                        Accuracy: ±{accuracy.toFixed(1)}m
                        {accuracy <= 10
                          ? " 🎯"
                          : accuracy <= 50
                            ? " 👍"
                            : " 📍"}
                        <br />
                      </>
                    )}
                    {isTracking ? "📍 Tracking enabled" : ""}
                    {isLoading ? (
                      <div
                        style={{
                          color: "#007bff",
                          marginTop: "8px",
                          fontSize: "13px",
                        }}
                      >
                        Loading location details... ⌛
                      </div>
                    ) : locationDetails ? (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px",
                        }}
                      >
                        {locationDetails.city && (
                          <div>City: {locationDetails.city}</div>
                        )}
                        {locationDetails.region && (
                          <div>Region: {locationDetails.region}</div>
                        )}
                        {locationDetails.country && (
                          <div>Country: {locationDetails.country}</div>
                        )}
                        {locationDetails.zip && (
                          <div>ZIP: {locationDetails.zip}</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Popup>
            </>
          )}
          {error && (
            <div
              style={{
                position: "absolute",
                top: "60px",
                left: "10px",
                backgroundColor: "#dc3545",
                color: "white",
                padding: "10px 15px",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                zIndex: 1000,
                maxWidth: "300px",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </>
      )}
    </>
  );
}
