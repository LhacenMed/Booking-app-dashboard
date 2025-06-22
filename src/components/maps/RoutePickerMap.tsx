import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Import location data
import { locations } from "./locationData";

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

// Define Leaflet Routing Machine types
interface RoutingWaypoint {
  latLng: L.LatLng;
  name?: string;
  options?: any;
}

interface RoutingRoute {
  coordinates: L.LatLng[];
  waypoints: RoutingWaypoint[];
  name: string;
  summary: {
    totalDistance: number;
    totalTime: number;
  };
}

interface RoutingWaypointEvent {
  waypoint: RoutingWaypoint;
  index: number;
}

interface RoutingRoutesFoundEvent {
  routes: RoutingRoute[];
}

// Declare leaflet-locate-control types
declare module "leaflet" {
  namespace control {
    function locate(options?: object): L.Control;
  }
  namespace Routing {
    function control(options?: object): L.Control & {
      hide(): void;
      getWaypoints(): RoutingWaypoint[];
      spliceWaypoints(
        index: number,
        num: number,
        waypoint?: L.LatLng
      ): RoutingWaypoint[];
      on(event: string, handler: Function): any;
    };
    function mapbox(token: string, options?: object): any;
  }
}

// Type for waypoint data structure
// type Waypoint = {
//   latLng: [number, number]; // [lng, lat] format
//   isIntermediate?: boolean;
// };

interface RoutePickerMapProps {
  startPoint: [number, number] | null;
  endPoint: [number, number] | null;
  onStartPointSelect: (location: [number, number] | null) => void;
  onEndPointSelect: (location: [number, number] | null) => void;
  onIntermediatePointsChange?: (waypoints: [number, number][]) => void;
  onRouteCalculated?: (coordinates: Array<[number, number]>) => void;
  intermediatePoints?: [number, number][];
  height?: string;
  width?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  showLocateControl?: boolean;
  className?: string;
}

/**
 * A map component for picking routes between two points with intermediate waypoints
 */
const RoutePickerMap: React.FC<RoutePickerMapProps> = ({
  startPoint,
  endPoint,
  onStartPointSelect,
  onEndPointSelect,
  onIntermediatePointsChange,
  onRouteCalculated,
  intermediatePoints: externalIntermediatePoints,
  height = "500px",
  width = "100%",
  defaultCenter = [18.079021, -15.965662], // Nouakchott, Mauritania
  defaultZoom = 13,
  showLocateControl = true,
  className = "",
}) => {
  // References to the map objects
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapContainerId = useRef(
    `route-map-container-${Math.random().toString(36).substring(2, 10)}`
  );
  const isInitializedRef = useRef(false);

  // Current active mode for selection
  const [selectionMode, setSelectionMode] = useState<"start" | "end" | null>(
    null
  );

  // Store intermediate waypoints
  const [internalIntermediatePoints, setInternalIntermediatePoints] = useState<
    [number, number][]
  >(externalIntermediatePoints || []);

  // Use the appropriate intermediate points source
  const intermediatePoints =
    externalIntermediatePoints !== undefined
      ? externalIntermediatePoints
      : internalIntermediatePoints;

  // Update internal state when external state changes
  useEffect(() => {
    if (externalIntermediatePoints !== undefined) {
      setInternalIntermediatePoints(externalIntermediatePoints);
    }
  }, [externalIntermediatePoints]);

  // Notify parent component when intermediate points change
  const updateIntermediatePoints = useCallback(
    (
      newPoints:
        | [number, number][]
        | ((prev: [number, number][]) => [number, number][])
    ) => {
      if (typeof newPoints === "function") {
        // If it's a function, call it with current state to get the new state
        const updatedPoints = newPoints(internalIntermediatePoints);
        setInternalIntermediatePoints(updatedPoints);

        // Notify parent component if callback is provided
        if (onIntermediatePointsChange) {
          onIntermediatePointsChange(updatedPoints);
        }
      } else {
        // If it's a direct value, use it directly
        setInternalIntermediatePoints(newPoints);

        // Notify parent component if callback is provided
        if (onIntermediatePointsChange) {
          onIntermediatePointsChange(newPoints);
        }
      }
    },
    [onIntermediatePointsChange, internalIntermediatePoints]
  );

  // Route information state
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  // New state to track if initial route fit has been done
  const initialFitDoneRef = useRef(false);

  // Function to fit map to route bounds
  const fitMapToRoute = useCallback(() => {
    if (
      !mapRef.current ||
      (!startPoint &&
        !endPoint &&
        (!intermediatePoints || intermediatePoints.length === 0))
    ) {
      return;
    }

    try {
      // Collect all points
      const points: L.LatLng[] = [];

      if (startPoint) {
        points.push(L.latLng(startPoint[1], startPoint[0]));
      }

      if (endPoint) {
        points.push(L.latLng(endPoint[1], endPoint[0]));
      }

      if (intermediatePoints && intermediatePoints.length > 0) {
        intermediatePoints.forEach((point) => {
          points.push(L.latLng(point[1], point[0]));
        });
      }

      // If we have at least 2 points, fit the map to those bounds
      if (points.length >= 2) {
        const bounds = L.latLngBounds(points);
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50], // Add some padding around the bounds
          maxZoom: 15, // Limit max zoom level for better usability
          animate: true,
        });
        return true;
      } else if (points.length === 1) {
        // If we only have one point, center on it with a reasonable zoom
        mapRef.current.setView(points[0], 14);
        return true;
      }
    } catch (error) {
      console.error("Error fitting map to route:", error);
    }

    return false;
  }, [startPoint, endPoint, intermediatePoints]);

  // Update map bounds when route changes
  useEffect(() => {
    // Only try to fit the map if we have at least the start or end point and initialization is complete
    if (isInitializedRef.current && (startPoint || endPoint)) {
      // If initial fit hasn't been done yet, or we have both start and end points
      if (!initialFitDoneRef.current || (startPoint && endPoint)) {
        const fitSuccessful = fitMapToRoute();
        if (fitSuccessful) {
          initialFitDoneRef.current = true;
        }
      }
    }
  }, [startPoint, endPoint, fitMapToRoute]);

  // Initialize the map once
  useEffect(() => {
    // Skip if map is already initialized or container is not ready
    if (isInitializedRef.current || mapRef.current) return;

    const container = document.getElementById(mapContainerId.current);
    if (!container) return;

    try {
      // Create map instance
      const map = L.map(mapContainerId.current, {
        center: defaultCenter as L.LatLngExpression,
        zoom: defaultZoom,
        zoomControl: true,
      });
      mapRef.current = map;

      // Add tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add locate control if enabled
      if (showLocateControl && L.control.locate) {
        L.control
          .locate({
            position: "topleft",
            setView: "once",
            enableHighAccuracy: true,
          })
          .addTo(map);
      }

      // Add circles for locations from the data file
      locations.forEach((location) => {
        const locationLatLng = L.latLng(
          location.coordinates[0],
          location.coordinates[1]
        );

        L.circle(locationLatLng, {
          radius: location.radius,
          color: location.color || "#3388ff",
          weight: 2,
          opacity: 0.6,
          fillColor: location.color || "#3388ff",
          fillOpacity: 0.2,
        }).addTo(map);
      });

      // Make sure map renders correctly
      map.invalidateSize(true);

      isInitializedRef.current = true;
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Cleanup function - when unmounting
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routingControlRef.current = null;
        markersRef.current = [];
        isInitializedRef.current = false;
      }
    };
  }, []); // Only run on mount and unmount

  // Clear all markers from the map
  const clearAllMarkers = useCallback(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });

    markersRef.current = [];
  }, []);

  // Create a marker for a waypoint
  const createWaypointMarker = useCallback(
    (
      position: L.LatLng,
      isStart: boolean,
      isEnd: boolean,
      isIntermediate: boolean,
      index: number
    ) => {
      if (!mapRef.current) return null;

      // Choose color based on waypoint type
      let color = "#4a80f5"; // Default blue for intermediate
      if (isStart) color = "#4ade80"; // Green for start
      if (isEnd) color = "#ef4444"; // Red for end

      // Check if point is inside any location circle
      const pointLatLng = [position.lat, position.lng] as [number, number];
      const locationName = getLocationName(pointLatLng);

      // Create tooltip text with location name if available
      let tooltipText = isStart
        ? "Start"
        : isEnd
          ? "Destination"
          : `Via point ${index}`;

      if (locationName) {
        tooltipText = isStart
          ? `Start: ${locationName}`
          : isEnd
            ? `Destination: ${locationName}`
            : `Via point ${index}: ${locationName}`;
      }

      const marker = L.marker(position, {
        draggable: true,
        icon: L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color:${color}; width:12px; height:12px; border-radius:50%; border:2px solid white;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(mapRef.current);

      // Add the tooltip
      marker.bindTooltip(tooltipText);

      // Handle marker drag events
      marker.on("dragend", function () {
        const position = marker.getLatLng();
        const newLngLat: [number, number] = [position.lng, position.lat];

        if (isStart) {
          onStartPointSelect(newLngLat);
        } else if (isEnd) {
          onEndPointSelect(newLngLat);
        } else if (isIntermediate) {
          // Update intermediate point
          updateIntermediatePoints((prev) => {
            const newPoints = [...prev];
            newPoints[index - 1] = newLngLat; // Adjust index (-1) since intermediates start at index 0
            return newPoints;
          });
        }
      });

      // Add delete handler with keyboard
      marker.on("click", function () {
        if (isIntermediate) {
          // Show tooltip about how to delete
          marker.setTooltipContent("Press Delete key to remove this waypoint");
          marker.openTooltip();

          // Add one-time listener for delete key
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete") {
              if (isIntermediate) {
                // Remove this intermediate point
                updateIntermediatePoints((prev) => {
                  return prev.filter((_, i) => i !== index - 1);
                });

                // Remove event listener
                document.removeEventListener("keydown", handleKeyDown);
              }
            }
          };

          // Add listener and remove it after 5 seconds if not used
          document.addEventListener("keydown", handleKeyDown);
          setTimeout(() => {
            document.removeEventListener("keydown", handleKeyDown);
            if (
              marker.getTooltip()?.getContent() ===
              "Press Delete key to remove this waypoint"
            ) {
              marker.setTooltipContent(tooltipText);
            }
          }, 5000);
        }
      });

      return marker;
    },
    [onStartPointSelect, onEndPointSelect, updateIntermediatePoints]
  );

  // Update all markers for start, end, and intermediate points
  const updateMarkers = useCallback(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    clearAllMarkers();

    // Create array to track new markers
    const newMarkers: L.Marker[] = [];

    // Add start marker if available
    if (startPoint) {
      const startMarker = createWaypointMarker(
        L.latLng(startPoint[1], startPoint[0]),
        true,
        false,
        false,
        0
      );
      if (startMarker) newMarkers.push(startMarker);
    }

    // Add intermediate markers
    intermediatePoints.forEach((point, index) => {
      const intermediateMarker = createWaypointMarker(
        L.latLng(point[1], point[0]),
        false,
        false,
        true,
        index + 1
      );
      if (intermediateMarker) newMarkers.push(intermediateMarker);
    });

    // Add end marker if available
    if (endPoint) {
      const endMarker = createWaypointMarker(
        L.latLng(endPoint[1], endPoint[0]),
        false,
        true,
        false,
        intermediatePoints.length + 1
      );
      if (endMarker) newMarkers.push(endMarker);
    }

    // Store the new markers
    markersRef.current = newMarkers;
  }, [
    startPoint,
    endPoint,
    intermediatePoints,
    clearAllMarkers,
    createWaypointMarker,
  ]);

  // Handle click events on the map
  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!selectionMode || !mapRef.current) return;

      const { lng, lat } = e.latlng;
      const newPoint: [number, number] = [lng, lat];

      // Check if point is inside any location
      const pointLatLng: [number, number] = [lat, lng];
      const locationName = getLocationName(pointLatLng);

      if (selectionMode === "start") {
        onStartPointSelect(newPoint);

        // Show location name if it exists
        if (locationName) {
          // Display a temporary message
          const messageDiv = document.createElement("div");
          messageDiv.className = "location-message";
          messageDiv.innerText = `Start point set in ${locationName}`;
          messageDiv.style.position = "absolute";
          messageDiv.style.bottom = "10px";
          messageDiv.style.left = "50%";
          messageDiv.style.transform = "translateX(-50%)";
          messageDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
          messageDiv.style.color = "white";
          messageDiv.style.padding = "8px 16px";
          messageDiv.style.borderRadius = "4px";
          messageDiv.style.zIndex = "1000";

          mapRef.current.getContainer().appendChild(messageDiv);

          // Remove message after 3 seconds
          setTimeout(() => {
            messageDiv.remove();
          }, 3000);
        }

        // After selecting a start point, automatically switch to end mode if no end point
        if (!endPoint) {
          setSelectionMode("end");
        } else {
          setSelectionMode(null);
        }
      } else if (selectionMode === "end") {
        onEndPointSelect(newPoint);

        // Show location name if it exists
        if (locationName) {
          // Display a temporary message
          const messageDiv = document.createElement("div");
          messageDiv.className = "location-message";
          messageDiv.innerText = `Destination set in ${locationName}`;
          messageDiv.style.position = "absolute";
          messageDiv.style.bottom = "10px";
          messageDiv.style.left = "50%";
          messageDiv.style.transform = "translateX(-50%)";
          messageDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
          messageDiv.style.color = "white";
          messageDiv.style.padding = "8px 16px";
          messageDiv.style.borderRadius = "4px";
          messageDiv.style.zIndex = "1000";

          mapRef.current.getContainer().appendChild(messageDiv);

          // Remove message after 3 seconds
          setTimeout(() => {
            messageDiv.remove();
          }, 3000);
        }

        setSelectionMode(null);
      }
    },
    [selectionMode, endPoint, onStartPointSelect, onEndPointSelect]
  );

  // Update click handler when selection mode changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.off("click");

    if (selectionMode) {
      map.on("click", handleMapClick);
      // Update cursor style based on mode
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.getContainer().style.cursor = "";
    }

    return () => {
      if (map) {
        map.off("click", handleMapClick);
      }
    };
  }, [selectionMode, handleMapClick]);

  // Update markers when points change
  useEffect(() => {
    updateMarkers();
  }, [startPoint, endPoint, intermediatePoints, updateMarkers]);

  // Update routing when waypoints change
  useEffect(() => {
    if (!mapRef.current || !startPoint || !endPoint) return;

    try {
      // Clear any existing routing control
      if (routingControlRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      // Create all waypoints in the correct order
      const waypoints = [
        L.latLng(startPoint[1], startPoint[0]), // Start point
        ...intermediatePoints.map((point) => L.latLng(point[1], point[0])), // Intermediate points
        L.latLng(endPoint[1], endPoint[0]), // End point
      ];

      // Create the routing control
      const routing = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true,
        showAlternatives: true,
        fitSelectedRoutes: false,
        lineOptions: {
          styles: [
            { color: "#242c81", opacity: 0.8, weight: 6 },
            { color: "#5f73f5", opacity: 1, weight: 3 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        altLineOptions: {
          styles: [
            { color: "#242c81", opacity: 0.4, weight: 6 },
            { color: "#5f73f5", opacity: 0.5, weight: 3 },
          ],
        },
        createMarker: () => null, // We'll manage our own markers
        show: false, // Don't show the instructions panel

        // The key difference: allow adding waypoints by clicking the route
        addWaypoints: true,
        waypointMode: "snap", // Snap to closest point on route

        // Use the default router
        draggableWaypoints: false,
      }).addTo(mapRef.current);

      // Hide the control panel but keep the route
      routing.hide();

      // Handle waypoint added by clicking the route
      routing.on("waypointadd", (e: RoutingWaypointEvent) => {
        if (e.waypoint && e.waypoint.latLng) {
          // Convert to our format [lng, lat]
          const newPoint: [number, number] = [
            e.waypoint.latLng.lng,
            e.waypoint.latLng.lat,
          ];

          // Determine insertion index based on e.index
          // Note: e.index tells us where in the waypoints array it was added
          const insertIndex = e.index - 1; // Adjust for our intermediatePoints array (excludes start)

          // Update intermediate points array
          updateIntermediatePoints((prev) => {
            const newPoints = [...prev];
            // Make sure we're not inserting at a negative index
            if (insertIndex >= 0 && insertIndex <= newPoints.length) {
              newPoints.splice(insertIndex, 0, newPoint);
            }
            return newPoints;
          });
        }
      });

      // Get route information when available
      routing.on("routesfound", (e: RoutingRoutesFoundEvent) => {
        if (e.routes && e.routes.length > 0) {
          const route = e.routes[0];
          setRouteInfo({
            distance: `${(route.summary.totalDistance / 1000).toFixed(2)} km`,
            duration: `${Math.round(route.summary.totalTime / 60)} minutes`,
          });

          // Fit the map to the route coordinates when route is found
          if (route.coordinates && route.coordinates.length > 0) {
            mapRef.current?.fitBounds(L.latLngBounds(route.coordinates), {
              padding: [50, 50],
              maxZoom: 15,
              animate: true,
            });

            // Convert Leaflet LatLng objects to [lng, lat] array for callback
            if (onRouteCalculated && route.coordinates) {
              const coords = route.coordinates.map(
                (latLng) => [latLng.lng, latLng.lat] as [number, number]
              );
              onRouteCalculated(coords);
            }
          }
        }
      });

      // Store the reference
      routingControlRef.current = routing;
    } catch (error) {
      console.error("Error setting up route:", error);
    }
  }, [startPoint, endPoint, intermediatePoints, onRouteCalculated]);

  // Clear all waypoints including intermediates
  const clearAllWaypoints = useCallback(() => {
    onStartPointSelect(null);
    onEndPointSelect(null);
    updateIntermediatePoints([]);

    // Remove routing control from map if it exists
    if (routingControlRef.current && mapRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Reset route info
    setRouteInfo(null);
  }, [
    onStartPointSelect,
    onEndPointSelect,
    updateIntermediatePoints,
    setRouteInfo,
  ]);

  // Helper function to check if a point is inside any location's circle
  const getLocationName = (point: [number, number]): string | null => {
    for (const location of locations) {
      const locationPoint = L.latLng(
        location.coordinates[0],
        location.coordinates[1]
      );
      const selectedPoint = L.latLng(point[0], point[1]);

      // Calculate distance between points in meters
      const distance = locationPoint.distanceTo(selectedPoint);

      // If distance is less than the radius, the point is inside the circle
      if (distance <= location.radius) {
        return location.name;
      }
    }
    return null;
  };

  return (
    <div className="route-picker-container">
      <div className="selection-controls mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectionMode("start")}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
            selectionMode === "start"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="w-3 h-3 bg-green-500 rounded-full border border-white"></span>
          {startPoint ? "Change Start Point" : "Set Start Point"}
        </button>
        <button
          onClick={() => setSelectionMode("end")}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
            selectionMode === "end"
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="w-3 h-3 bg-red-500 rounded-full border border-white"></span>
          {endPoint ? "Change End Point" : "Set End Point"}
        </button>
        {selectionMode && (
          <button
            onClick={() => setSelectionMode(null)}
            className="px-3 py-1.5 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Cancel Selection
          </button>
        )}
        <button
          onClick={clearAllWaypoints}
          className="px-3 py-1.5 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 ml-auto"
          disabled={!startPoint && !endPoint && intermediatePoints.length === 0}
        >
          Clear All Points
        </button>
      </div>

      {selectionMode && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          Click on the map to select{" "}
          {selectionMode === "start" ? "starting" : "destination"} point
        </div>
      )}

      {startPoint && endPoint && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <p>
            Click anywhere on the blue route line to add an intermediate
            waypoint. Click on any intermediate waypoint and press the Delete
            key to remove it.
          </p>
        </div>
      )}

      <div
        id={mapContainerId.current}
        style={{ height, width }}
        className={`border border-gray-300 rounded-lg ${className}`}
      />

      {startPoint && endPoint && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Route:</strong> From {startPoint[1].toFixed(6)},{" "}
            {startPoint[0].toFixed(6)} to {endPoint[1].toFixed(6)},{" "}
            {endPoint[0].toFixed(6)}
            {intermediatePoints.length > 0 &&
              ` via ${intermediatePoints.length} intermediate point${intermediatePoints.length > 1 ? "s" : ""}`}
          </p>
          {routeInfo && (
            <p className="text-sm text-blue-700 mt-1">
              <strong>Distance:</strong> {routeInfo.distance} •{" "}
              <strong>Time:</strong> {routeInfo.duration}
            </p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            You can drag any marker to adjust the route
          </p>
        </div>
      )}
    </div>
  );
};

export default RoutePickerMap;
