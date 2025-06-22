import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  MapIcon,
  RotateCw,
  Save,
} from "lucide-react";
// import RouteMap from "./route-map";
import RoutePickerMap from "./maps/RoutePickerMap";
import LocationSearch from "./location-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ux/tabs";
import { Badge } from "@/components/ux/badge";
import { Separator } from "@/components/ux/separator";
import { Progress } from "@/components/ux/progress";
import { Button } from "@/components/ux/button";
import { Card, CardContent } from "@/components/ux/card";
import { Input } from "@/components/ux/input";
import { Label } from "@/components/ux/label";
// Import the location data and helper function
import { locations } from "./maps/locationData";

type Location = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
};

// Helper function to get location name from coordinates
const getLocationName = (lat: number, lng: number): string | null => {
  for (const location of locations) {
    const locationPoint = {
      lat: location.coordinates[0],
      lng: location.coordinates[1],
    };
    const selectedPoint = { lat, lng };

    // Calculate distance between points in meters (simple approximation)
    const R = 6371e3; // Earth radius in meters
    const φ1 = (locationPoint.lat * Math.PI) / 180;
    const φ2 = (selectedPoint.lat * Math.PI) / 180;
    const Δφ = ((selectedPoint.lat - locationPoint.lat) * Math.PI) / 180;
    const Δλ = ((selectedPoint.lng - locationPoint.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // If distance is less than the radius, the point is inside the circle
    if (distance <= location.radius) {
      return location.name;
    }
  }
  return null;
};

export default function RouteCreator() {
  const [departure, setDeparture] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [stops, setStops] = useState<Location[]>([]);
  const [routeName, setRouteName] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [isSaving, setIsSaving] = useState(false);
  const routeCoordinatesRef = useRef<Array<[number, number]>>([]);

  // Auto-generate route name when departure or destination changes
  useEffect(() => {
    if (departure?.name && destination?.name) {
      setRouteName(`${departure.name} to ${destination.name}`);
    } else if (departure?.name) {
      setRouteName(`${departure.name} route`);
    } else if (destination?.name) {
      setRouteName(`Route to ${destination.name}`);
    } else {
      setRouteName("");
    }
  }, [departure, destination]);

  // Handle departure selection with auto-naming
  const handleDepartureSelect = (location: Location) => {
    setDeparture(location);
  };

  // Handle destination selection with auto-naming
  const handleDestinationSelect = (location: Location) => {
    setDestination(location);
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    const total = 3; // Route name, departure, destination are required

    if (routeName) completed++;
    if (departure) completed++;
    if (destination) completed++;

    return Math.floor((completed / total) * 100);
  };

  // Function to handle route calculation and log passed areas
  const handleRouteCalculated = (coordinates: Array<[number, number]>) => {
    routeCoordinatesRef.current = coordinates;
    
    // Log areas that the route passes through
    if (coordinates.length > 0) {
      const routeAreas = new Set<string>();
      
      // Check each coordinate to see if it falls within a defined area
      coordinates.forEach(coord => {
        const locationName = getLocationName(coord[1], coord[0]);
        if (locationName) {
          routeAreas.add(locationName);
        }
      });
      
      // Log the unique areas
      const areasArray = Array.from(routeAreas);
      if (areasArray.length > 0) {
        console.log("Route passes through these areas:", areasArray);
      } else {
        console.log("Route doesn't pass through any predefined areas");
      }
    }
  };

  const addStop = () => {
    const newStop = {
      id: `stop-${stops.length + 1}`,
      name: "",
    };
    setStops([...stops, newStop]);
  };

  const updateStop = (index: number, location: Location) => {
    const newStops = [...stops];
    newStops[index] = location;
    setStops(newStops);
  };

  const removeStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!departure || !destination || !routeName) {
      alert("Please fill in all required fields");
      return;
    }

    // Simulate saving
    setIsSaving(true);

    setTimeout(() => {
      // Create route object
      const route = {
        name: routeName,
        departure,
        destination,
        stops,
      };

      // Here you would typically send this data to your API
      console.log("Submitting route:", route);

      setIsSaving(false);

      // Show success message
      alert("Route created successfully!");

      // Reset form
      setRouteName("");
      setDeparture(null);
      setDestination(null);
      setStops([]);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3">
        <Card className="shadow-md border-slate-200">
          <Tabs
            defaultValue="details"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="text-sm">
                  <span className="flex items-center">
                    <MapIcon className="mr-2 h-4 w-4" />
                    Route Details
                  </span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-sm">
                  <span className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Route Preview
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="pt-6">
              <TabsContent value="details" className="mt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="route-name" className="text-sm font-medium">
                      Route Name <span className="text-red-500">*</span>{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        (Auto-generated from departure and destination)
                      </span>
                    </Label>
                    <Input
                      id="route-name"
                      placeholder="Route name will be auto-generated"
                      value={routeName}
                      className="border-slate-300 focus:border-slate-500 bg-slate-50"
                      disabled
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="departure"
                        className="text-sm font-medium flex items-center"
                      >
                        <Badge
                          variant="outline"
                          className="mr-2 bg-green-50 text-green-700 border-green-200"
                        >
                          Start
                        </Badge>
                        Departure Location{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <LocationSearch
                        id="departure"
                        placeholder="Search for departure location"
                        onSelect={handleDepartureSelect}
                        selectedLocation={departure}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="destination"
                        className="text-sm font-medium flex items-center"
                      >
                        <Badge
                          variant="outline"
                          className="mr-2 bg-red-50 text-red-700 border-red-200"
                        >
                          End
                        </Badge>
                        Destination Location{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <LocationSearch
                        id="destination"
                        placeholder="Search for destination location"
                        onSelect={handleDestinationSelect}
                        selectedLocation={destination}
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Intermediate Stops
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addStop}
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Stop
                      </Button>
                    </div>

                    {stops.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md bg-slate-50">
                        <p className="text-slate-500 text-sm">
                          No intermediate stops added yet
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={addStop}
                          className="mt-2 text-sm"
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add your first stop
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stops.map((stop, index) => (
                          <div
                            key={stop.id}
                            className="flex items-center gap-2 group"
                          >
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <LocationSearch
                                id={`stop-${index}`}
                                placeholder={`Stop ${index + 1}`}
                                onSelect={(location) =>
                                  updateStop(index, location)
                                }
                                selectedLocation={stop}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStop(index)}
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div>
                  <RoutePickerMap
                    startPoint={
                      departure?.lng && departure?.lat
                        ? [departure.lng, departure.lat]
                        : null
                    }
                    endPoint={
                      destination?.lng && destination?.lat
                        ? [destination.lng, destination.lat]
                        : null
                    }
                    onStartPointSelect={(location) => {
                      if (location) {
                        // Check if the selected point is inside any predefined location
                        const locationName = getLocationName(
                          location[1],
                          location[0]
                        );

                        setDeparture({
                          id: departure?.id || "departure",
                          name: locationName || "Custom Departure",
                          lng: location[0],
                          lat: location[1],
                        });
                      } else {
                        setDeparture(null);
                      }
                    }}
                    onEndPointSelect={(location) => {
                      if (location) {
                        // Check if the selected point is inside any predefined location
                        const locationName = getLocationName(
                          location[1],
                          location[0]
                        );

                        setDestination({
                          id: destination?.id || "destination",
                          name: locationName || "Custom Destination",
                          lng: location[0],
                          lat: location[1],
                        });
                      } else {
                        setDestination(null);
                      }
                    }}
                    intermediatePoints={stops
                      .filter((stop) => stop.lng && stop.lat)
                      .map((stop) => [stop.lng, stop.lat] as [number, number])}
                    onIntermediatePointsChange={(waypoints) => {
                      setStops(
                        waypoints.map((point, index) => {
                          // Check if the waypoint is inside any predefined location
                          const locationName = getLocationName(
                            point[1],
                            point[0]
                          );

                          return {
                            id: `stop-${index + 1}`,
                            name:
                              locationName ||
                              stops[index]?.name ||
                              `Stop ${index + 1}`,
                            lng: point[0],
                            lat: point[1],
                          };
                        })
                      );
                    }}
                    onRouteCalculated={handleRouteCalculated}
                    height="500px"
                    width="100%"
                    showLocateControl={true}
                  />
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* <div>
        <Card className="shadow-md border-slate-200 sticky top-6">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Route Summary</h3>
                <Progress value={calculateCompletion()} className="h-2 mb-2" />
                <p className="text-sm text-slate-500">
                  {calculateCompletion() === 100
                    ? "All required information provided"
                    : "Please complete all required fields"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {routeName ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Route Name</p>
                    <p className="text-sm text-slate-500">
                      {routeName || "Auto-generated from locations"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {departure ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Departure</p>
                    <p className="text-sm text-slate-500">
                      {departure?.name || "Not specified yet"}
                    </p>
                  </div>
                </div>

                {stops.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Intermediate Stops</p>
                      <p className="text-sm text-slate-500">
                        {stops.length} stop{stops.length !== 1 ? "s" : ""} added
                      </p>
                      <div className="mt-2 space-y-1">
                        {stops.map((stop, index) => (
                          <div
                            key={stop.id}
                            className="flex items-center text-sm"
                          >
                            <div className="h-4 w-4 rounded-full bg-slate-100 text-slate-700 text-[10px] flex items-center justify-center mr-2">
                              {index + 1}
                            </div>
                            <span className="text-slate-600 truncate">
                              {stop.name || `Stop ${index + 1} (unnamed)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {destination ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Destination</p>
                    <p className="text-sm text-slate-500">
                      {destination?.name || "Not specified yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                  disabled={
                    !departure || !destination || !routeName || isSaving
                  }
                >
                  {isSaving ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving Route...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Custom Route
                    </>
                  )}
                </Button>

                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-slate-500"
                  >
                    Cancel and discard changes
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
