import { Map, GeolocateControl } from "@vis.gl/react-maplibre";
import { middleOfUSA } from "../lib/constants";
import YouAreHere from "../components/you-are-here";
import "maplibre-gl/dist/maplibre-gl.css";

// Styles for the map container to ensure full viewport coverage
const mapContainerStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100vw",
  height: "100vh",
} as const;

export default function MapPage() {
  return (
    // Container div to ensure map takes full viewport
    <div style={mapContainerStyle}>
      <Map
        initialViewState={{
          longitude: middleOfUSA[0],
          latitude: middleOfUSA[1],
          zoom: 2,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
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
        <YouAreHere />
      </Map>
    </div>
  );
}
