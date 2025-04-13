/**
 * Location data for displaying circles on the map
 * Each location has coordinates, radius and optional styling
 *
 * To add a new location:
 * 1. Simply add a new entry to the locations array
 * 2. Provide the name, coordinates [lat, lng], and radius (in meters)
 * 3. Optionally add a color (hex code)
 */

export interface MapLocation {
  /** Display name of the location */
  name: string;
  /** Coordinates in [latitude, longitude] format */
  coordinates: [number, number]; // [lat, lng]
  /** Circle radius in meters */
  radius: number; // in meters
  /** Optional hex color code (e.g. "#ff0000" for red) */
  color?: string;
}

export const locations: MapLocation[] = [
  {
    name: "Nouakchott",
    coordinates: [18.0857, -15.9785],
    radius: 18000, // 18km
    // color: "#3388ff",
  },
  {
    name: "Wad Naga",
    coordinates: [17.960396, -15.525355],
    radius: 10000, // 10km
    // color: "#ff6b6b",
  },
  {
    name: "Akjoujt",
    coordinates: [19.7471, -14.3853],
    radius: 8000, // 8km
    // color: "#4ade80",
  },
  {
    name: "Boutilimit",
    coordinates: [17.55, -14.7],
    radius: 6000, // 6km
    // color: "#a855f7",
  },
  {
    name: "Aleg",
    coordinates: [17.05374, -13.913498],
    radius: 6000, // 6km
    // color: "#a855f7",
  },
];
