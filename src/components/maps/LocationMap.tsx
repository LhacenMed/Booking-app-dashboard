import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";

// Fix Leaflet default icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Declare leaflet-locate-control types
declare module "leaflet" {
  namespace control {
    function locate(options?: any): any;
  }
}

interface LocationMapProps {
  selectedLocation: [number, number] | null;
  onLocationSelect: (location: [number, number]) => void;
  isPickingMode: boolean;
  onPickingModeChange?: (isPicking: boolean) => void;
  height?: string;
  width?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  showLocateControl?: boolean;
  className?: string;
}

/**
 * A reusable Leaflet map component for selecting locations
 */
const LocationMap: React.FC<LocationMapProps> = ({
  selectedLocation,
  onLocationSelect,
  isPickingMode,
  onPickingModeChange,
  height = "400px",
  width = "100%",
  defaultCenter = [18.079021, -15.965662], // Nouakchott, Mauritania
  defaultZoom = 13,
  showLocateControl = true,
  className = "",
}) => {
  // Reference to the map and marker instances
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerId = useRef(
    `map-container-${Math.random().toString(36).substring(2, 10)}`
  );
  const isInitializedRef = useRef(false);
  const skipNextViewUpdate = useRef(false);
  const lastIsPickingModeRef = useRef(isPickingMode);

  // Handle map click event
  const handleMapClick = useCallback(
    (event: L.LeafletMouseEvent) => {
      if (!isPickingMode) return;

      const { lat, lng } = event.latlng;

      // Update the selected location
      onLocationSelect([lng, lat]);

      // If there's a callback for picking mode, call it
      if (onPickingModeChange) {
        onPickingModeChange(false);
      }
    },
    [isPickingMode, onLocationSelect, onPickingModeChange]
  );

  // Initialize the map only once
  useEffect(() => {
    // Skip if map is already initialized or container is not ready
    if (isInitializedRef.current || mapRef.current) return;

    const container = document.getElementById(mapContainerId.current);
    if (!container) return;

    try {
      // Create map instance
      const initialCenter = selectedLocation
        ? [selectedLocation[1], selectedLocation[0]]
        : defaultCenter;

      mapRef.current = L.map(mapContainerId.current, {
        center: initialCenter as L.LatLngExpression,
        zoom: defaultZoom,
        zoomControl: true,
      });

      // Add tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add locate control if enabled
      if (showLocateControl && L.control.locate) {
        L.control
          .locate({
            position: "topleft",
            setView: "once",
            enableHighAccuracy: true,
          })
          .addTo(mapRef.current);
      }

      // Add initial marker if we have a location
      if (selectedLocation) {
        markerRef.current = L.marker(
          [selectedLocation[1], selectedLocation[0]],
          { draggable: isPickingMode }
        ).addTo(mapRef.current);
      }

      // Handle map move events to prevent refreshing
      mapRef.current.on("movestart", () => {
        skipNextViewUpdate.current = true;
      });

      // Make sure map renders correctly
      mapRef.current.invalidateSize(true);

      // Add a delayed resize to ensure the map renders properly
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize(true);
        }
      }, 300);

      isInitializedRef.current = true;
      lastIsPickingModeRef.current = isPickingMode;
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Cleanup function - but NOT on every render or prop change, only when truly unmounting
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        isInitializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount and unmount

  // Handle click events
  useEffect(() => {
    if (!mapRef.current || !isInitializedRef.current) return;

    // Remove existing click handler
    mapRef.current.off("click");

    // Add click handler for location picking
    mapRef.current.on("click", handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
      }
    };
  }, [handleMapClick]);

  // Update map cursor style based on picking mode without causing reinitialization
  useEffect(() => {
    if (!mapRef.current || !isInitializedRef.current) return;

    // Only update if picking mode actually changed
    if (lastIsPickingModeRef.current !== isPickingMode) {
      const mapElement = mapRef.current.getContainer();
      if (mapElement) {
        mapElement.style.cursor = isPickingMode ? "crosshair" : "grab";
      }
      lastIsPickingModeRef.current = isPickingMode;
    }
  }, [isPickingMode]);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current || !isInitializedRef.current) return;

    // If we have a location
    if (selectedLocation) {
      const latLng = [selectedLocation[1], selectedLocation[0]] as [
        number,
        number,
      ];

      // Update existing marker or create a new one
      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
      } else {
        markerRef.current = L.marker(latLng, {
          draggable: isPickingMode,
        }).addTo(mapRef.current);
      }

      // Only center the map when a new location is initially selected
      // or if the user hasn't moved the map manually
      if (!skipNextViewUpdate.current) {
        mapRef.current.setView(latLng, mapRef.current.getZoom());
      } else {
        skipNextViewUpdate.current = false;
      }
    } else if (markerRef.current && mapRef.current) {
      // Remove marker if no location is selected
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }, [selectedLocation]);

  // Update marker draggability when picking mode changes without reinitializing map
  useEffect(() => {
    // Skip if marker doesn't exist yet
    if (!markerRef.current || !isInitializedRef.current) return;

    // Only update if picking mode actually changed
    if (lastIsPickingModeRef.current !== isPickingMode) {
      // Remove existing dragend handler
      markerRef.current.off("dragend");

      if (isPickingMode) {
        markerRef.current.dragging?.enable();

        // Add dragend event to update location when marker is dragged
        markerRef.current.on("dragend", function (event) {
          const marker = event.target;
          const position = marker.getLatLng();
          skipNextViewUpdate.current = true; // Skip the next view update when dragging
          onLocationSelect([position.lng, position.lat]);
        });
      } else {
        markerRef.current.dragging?.disable();
      }

      lastIsPickingModeRef.current = isPickingMode;
    }
  }, [isPickingMode, onLocationSelect]);

  // Fix Leaflet rendering issues that can occur when container size changes
  useEffect(() => {
    if (!mapRef.current || !isInitializedRef.current) return;

    // Force map to update its size when component is rendered
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize(true);
      }
    }, 0);
  }, [height, width]);

  return (
    <div
      id={mapContainerId.current}
      style={{ height, width }}
      className={className}
    />
  );
};

export default LocationMap;
