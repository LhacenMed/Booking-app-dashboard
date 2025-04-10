import React, { useCallback, memo } from "react";
import { FiMapPin } from "react-icons/fi";
import LocationMap from "./LocationMap";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: [number, number] | null;
  onLocationSelect: (location: [number, number]) => void;
  isPickingMode: boolean;
  onPickingModeChange: (isPicking: boolean) => void;
}

/**
 * A modal component for picking locations on a map
 */
const LocationPickerModal: React.FC<LocationPickerModalProps> = memo(
  ({
    isOpen,
    onClose,
    selectedLocation,
    onLocationSelect,
    isPickingMode,
    onPickingModeChange,
  }) => {
    // Memoize the toggle function to prevent unnecessary rerenders
    const togglePickingMode = useCallback(() => {
      onPickingModeChange(!isPickingMode);
    }, [isPickingMode, onPickingModeChange]);

    // Memoize the location select handler
    const handleLocationSelect = useCallback(
      (location: [number, number]) => {
        onLocationSelect(location);
      },
      [onLocationSelect]
    );

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-900 rounded-lg w-full max-w-2xl overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h3 className="text-lg font-ot-medium text-white">
              Select Location
            </h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePickingMode}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                  isPickingMode
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-white/60 hover:text-white"
                }`}
              >
                <FiMapPin className="w-4 h-4" />
                {isPickingMode ? "Picking Location..." : "Pick Location"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="h-[400px] relative">
            {isPickingMode && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
                Click anywhere on the map to select location
              </div>
            )}
            <LocationMap
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              isPickingMode={isPickingMode}
              onPickingModeChange={onPickingModeChange}
              height="400px"
              width="100%"
              showLocateControl={true}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    );
  }
);

export default LocationPickerModal;
