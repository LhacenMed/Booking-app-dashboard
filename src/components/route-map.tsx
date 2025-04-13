import { useRef } from "react";
import { MapPin, Navigation } from "lucide-react";

type Location = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
};

interface RouteMapProps {
  departure: Location | null;
  destination: Location | null;
  stops: Location[];
}

export default function RouteMap({
  departure,
  destination,
  stops,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // In a real application, you would use a mapping library like Google Maps, Mapbox, or Leaflet
  // This is a simplified placeholder visualization

  const hasLocations = departure || destination || stops.length > 0;

  // Simulate a route path with SVG
  const renderRoutePath = () => {
    const totalStops = [
      ...(departure ? [departure] : []),
      ...stops,
      ...(destination ? [destination] : []),
    ].filter(Boolean);

    if (totalStops.length < 2) return null;

    // Create a simple path
    const height = 300;
    const width = 500;
    const padding = 50;
    const availableWidth = width - padding * 2;
    const stepWidth = availableWidth / (totalStops.length - 1);

    const points = totalStops
      .map((_, index) => {
        const x = padding + stepWidth * index;
        // Add some randomness to y to make it look more like a route
        const randomY = Math.sin(index * 0.5) * 30;
        const y = height / 2 + randomY;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        {/* Dotted background grid */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="#e2e8f0" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Route path */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0"
        />

        {/* Start point */}
        {departure && (
          <circle
            cx={padding}
            cy={height / 2 + Math.sin(0) * 30}
            r="8"
            fill="#22c55e"
          />
        )}

        {/* Intermediate points */}
        {stops.map((_, index) => (
          <circle
            key={index}
            cx={padding + stepWidth * (index + 1)}
            cy={height / 2 + Math.sin((index + 1) * 0.5) * 30}
            r="6"
            fill="#3b82f6"
          />
        ))}

        {/* End point */}
        {destination && (
          <circle
            cx={padding + stepWidth * (totalStops.length - 1)}
            cy={height / 2 + Math.sin((totalStops.length - 1) * 0.5) * 30}
            r="8"
            fill="#ef4444"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="w-full h-full rounded-md overflow-hidden bg-slate-50 relative border border-slate-200">
      {!hasLocations ? (
        <div className="flex items-center justify-center h-full text-slate-400">
          <div className="text-center max-w-xs">
            <Navigation className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              No Route Selected
            </h3>
            <p className="text-sm">
              Add departure and destination locations to see your route preview
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 h-full relative">
          {renderRoutePath()}

          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-slate-500" />
              Route Overview
            </h3>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {departure && (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <MapPin className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-sm font-medium">{departure.name}</div>
                </div>
              )}

              {stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center pl-4">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-blue-600 text-xs font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div className="text-sm">
                    {stop.name || `Stop ${index + 1}`}
                  </div>
                </div>
              ))}

              {destination && (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <MapPin className="h-3 w-3 text-red-600" />
                  </div>
                  <div className="text-sm font-medium">{destination.name}</div>
                </div>
              )}
            </div>

            {departure && destination && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <span>Total stops: {stops.length}</span>
                <span>Estimated distance: 42 miles</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
