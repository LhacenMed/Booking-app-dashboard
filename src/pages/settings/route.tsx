import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input, Textarea } from "@heroui/react";
import RoutePickerMap from "@/components/maps/RoutePickerMap";
import RouteCreator from "@/components/route-creator";

/**
 * Custom Route Creation/Edit Page
 *
 * This page allows users to create and edit custom routes for their business.
 * It provides a map interface for selecting route points and form fields for
 * additional route metadata like name and description.
 */
export const RoutePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const routeId = params.get("id");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Route state
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [intermediatePoints, setIntermediatePoints] = useState<
    [number, number][]
  >([]);

  // Route form data
  const [routeForm, setRouteForm] = useState({
    name: "",
    startLocationName: "",
    endLocationName: "",
    description: "",
    isDefault: false,
    tripType: "delivery", // delivery, pickup, round-trip
  });

  // Route metrics (calculated from the map)
  const [routeMetrics, setRouteMetrics] = useState({
    distance: "",
    duration: "",
    waypoints: 0,
  });

  // Load route data if editing an existing route
  useEffect(() => {
    if (routeId) {
      setIsLoading(true);

      // In a real app, you would fetch the route data from your API here
      // This is a mockup that simulates loading existing route data
      setTimeout(() => {
        // Mock data for different routes
        const routeData = {
          "route-1": {
            name: "Downtown Delivery Route",
            startLocationName: "Company Headquarters",
            endLocationName: "Downtown Business District",
            description: "Standard delivery route to downtown businesses",
            isDefault: true,
            tripType: "delivery",
            startPoint: [18.079021, -15.965662] as [number, number],
            endPoint: [18.082023, -15.975664] as [number, number],
            intermediatePoints: [
              [18.080521, -15.969662] as [number, number],
              [18.081023, -15.972664] as [number, number],
            ],
            distance: "12.5 km",
            duration: "25 min",
          },
          "route-2": {
            name: "Airport Transit",
            startLocationName: "Company Headquarters",
            endLocationName: "International Airport",
            description: "Transportation route to the airport",
            isDefault: false,
            tripType: "round-trip",
            startPoint: [18.079021, -15.965662] as [number, number],
            endPoint: [18.095023, -15.955664] as [number, number],
            intermediatePoints: [[18.085021, -15.960662] as [number, number]],
            distance: "35.8 km",
            duration: "45 min",
          },
          "route-3": {
            name: "North Warehouse Supply",
            startLocationName: "Distribution Center",
            endLocationName: "North Warehouse",
            description: "Supply delivery to the north warehouse",
            isDefault: false,
            tripType: "delivery",
            startPoint: [18.079021, -15.965662] as [number, number],
            endPoint: [18.089021, -15.945662] as [number, number],
            intermediatePoints: [],
            distance: "18.2 km",
            duration: "30 min",
          },
        };

        // Get the route data for the selected ID
        const data = routeData[routeId as keyof typeof routeData];

        if (data) {
          // Set the route form data
          setRouteForm({
            name: data.name,
            startLocationName: data.startLocationName,
            endLocationName: data.endLocationName,
            description: data.description,
            isDefault: data.isDefault,
            tripType: data.tripType,
          });

          // Set the route points
          setStartPoint(data.startPoint);
          setEndPoint(data.endPoint);
          setIntermediatePoints(data.intermediatePoints);

          // Set the route metrics
          setRouteMetrics({
            distance: data.distance,
            duration: data.duration,
            waypoints: data.intermediatePoints.length + 2, // Start + End + Intermediate
          });
        }

        setIsLoading(false);
      }, 800);
    }
  }, [routeId]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Handle checkbox input
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setRouteForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // Handle all other inputs
    setRouteForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle trip type selection
  const handleTripTypeChange = (type: string) => {
    setRouteForm((prev) => ({ ...prev, tripType: type }));
  };

  // Save the route
  const saveRoute = async () => {
    if (!startPoint || !endPoint) {
      alert("Please set both starting and destination points");
      return;
    }

    if (!routeForm.name.trim()) {
      alert("Please enter a route name");
      return;
    }

    setIsSaving(true);

    try {
      // Format waypoints in order (start, intermediates, end)
      const routeData = {
        name: routeForm.name,
        startLocationName: routeForm.startLocationName || "Starting Point",
        endLocationName: routeForm.endLocationName || "Destination Point",
        description: routeForm.description,
        isDefault: routeForm.isDefault,
        tripType: routeForm.tripType,
        waypoints: [
          {
            lat: startPoint[1],
            lng: startPoint[0],
            name: routeForm.startLocationName || "Starting Point",
            type: "start",
          },
          ...intermediatePoints.map((point, index) => ({
            lat: point[1],
            lng: point[0],
            name: `Via Point ${index + 1}`,
            type: "via",
          })),
          {
            lat: endPoint[1],
            lng: endPoint[0],
            name: routeForm.endLocationName || "Destination Point",
            type: "end",
          },
        ],
        // Metrics would be calculated by the backend in a real implementation
        distance: routeMetrics.distance || "Calculating...",
        duration: routeMetrics.duration || "Calculating...",
        created: new Date().toISOString().split("T")[0],
        id: routeId || `route-${Date.now()}`,
      };

      console.log("Saving route:", routeData);

      // Simulate API call
      setTimeout(() => {
        setIsSaving(false);
        alert(`Route "${routeData.name}" successfully saved!`);
        navigate("/dashboard/settings/general");
      }, 1000);
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Failed to save route: " + (error as Error).message);
      setIsSaving(false);
    }
  };

  // Cancel route creation/editing
  const handleCancel = () => {
    navigate("/dashboard/settings/general");
  };

  // Update route metrics when map calculates a route
  const handleRouteCalculated = (distance: string, duration: string) => {
    setRouteMetrics({
      distance,
      duration,
      waypoints: (intermediatePoints.length || 0) + 2, // Start + End + Intermediate
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-ot-bold">
          {routeId ? "Edit Route" : "Create New Route"}
        </h1>
        <div className="flex space-x-3">
          <Button color="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={saveRoute}
            isLoading={isSaving}
            disabled={!startPoint || !endPoint || !routeForm.name.trim()}
          >
            Save Route
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Route details form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-ot-semibold mb-4">Route Details</h2>

              <div className="space-y-4">
                <Input
                  label="Route Name"
                  name="name"
                  value={routeForm.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Downtown Delivery Route"
                  required
                />

                <Input
                  label="Starting Location Name"
                  name="startLocationName"
                  value={routeForm.startLocationName}
                  onChange={handleInputChange}
                  placeholder="e.g., Company Headquarters"
                />

                <Input
                  label="Destination Name"
                  name="endLocationName"
                  value={routeForm.endLocationName}
                  onChange={handleInputChange}
                  placeholder="e.g., City Center"
                />

                <Textarea
                  label="Route Description"
                  name="description"
                  value={routeForm.description}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose of this route..."
                  rows={3}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip Type
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md ${
                        routeForm.tripType === "delivery"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      } border`}
                      onClick={() => handleTripTypeChange("delivery")}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md ${
                        routeForm.tripType === "pickup"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      } border`}
                      onClick={() => handleTripTypeChange("pickup")}
                    >
                      Pickup
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md ${
                        routeForm.tripType === "round-trip"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      } border`}
                      onClick={() => handleTripTypeChange("round-trip")}
                    >
                      Round Trip
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={routeForm.isDefault}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isDefault"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Set as default route
                  </label>
                </div>
              </div>
            </div>

            {/* Route Metrics Card */}
            {(startPoint || endPoint) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-ot-semibold mb-4">Route Metrics</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Total Distance</div>
                    <div className="text-xl font-medium text-gray-900">
                      {routeMetrics.distance || "Calculating..."}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Estimated Time</div>
                    <div className="text-xl font-medium text-gray-900">
                      {routeMetrics.duration || "Calculating..."}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Waypoints</div>
                    <div className="text-xl font-medium text-gray-900">
                      {routeMetrics.waypoints || 0}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="text-xl font-medium text-gray-900">
                      {routeForm.tripType.charAt(0).toUpperCase() +
                        routeForm.tripType.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-ot-semibold mb-4">Route Map</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Select starting and destination points on the map. Add
                  intermediate waypoints by clicking on the route line.
                </p>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-600">Start</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-600">Via</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-600">End</span>
                  </div>
                </div>
              </div>

              {/* Route Map */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <RoutePickerMap
                  startPoint={startPoint}
                  endPoint={endPoint}
                  intermediatePoints={intermediatePoints}
                  onStartPointSelect={setStartPoint}
                  onEndPointSelect={setEndPoint}
                  onIntermediatePointsChange={setIntermediatePoints}
                  height="500px"
                  width="100%"
                  showLocateControl={true}
                />
              </div>

              {/* Map instructions */}
              <div className="mt-4 text-sm text-gray-500">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Click on the map to set start and end points</li>
                  <li>Click on the route line to add intermediate waypoints</li>
                  <li>Drag markers to adjust their positions</li>
                  <li>Click on a waypoint and press Delete to remove it</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <RouteCreator />
    </div>
  );
};
