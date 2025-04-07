import { middleOfUSA } from "./constants";

export interface LocationResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

export async function getLocation(): Promise<[number, number]> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
      resolve(middleOfUSA);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      (error) => {
        console.error("Error getting location:", error);
        resolve(middleOfUSA);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}