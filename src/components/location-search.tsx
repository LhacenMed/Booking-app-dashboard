import { useState, useEffect } from "react";
import { Button } from "@/components/ux/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ux/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ux/popover";
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Location = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
};

// Mock locations for demo purposes
const mockLocations: Location[] = [
  { id: "nyc", name: "New York City", lat: 40.7128, lng: -74.006 },
  { id: "la", name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { id: "chi", name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { id: "hou", name: "Houston", lat: 29.7604, lng: -95.3698 },
  { id: "phx", name: "Phoenix", lat: 33.4484, lng: -112.074 },
  { id: "phi", name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
  { id: "san", name: "San Antonio", lat: 29.4241, lng: -98.4936 },
  { id: "sd", name: "San Diego", lat: 32.7157, lng: -117.1611 },
  { id: "dal", name: "Dallas", lat: 32.7767, lng: -96.797 },
  { id: "sj", name: "San Jose", lat: 37.3382, lng: -121.8863 },
  { id: "bos", name: "Boston", lat: 42.3601, lng: -71.0589 },
  { id: "atl", name: "Atlanta", lat: 33.749, lng: -84.388 },
  { id: "mia", name: "Miami", lat: 25.7617, lng: -80.1918 },
  { id: "den", name: "Denver", lat: 39.7392, lng: -104.9903 },
  { id: "sea", name: "Seattle", lat: 47.6062, lng: -122.3321 },
];

interface LocationSearchProps {
  id: string;
  placeholder: string;
  onSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

export default function LocationSearch({
  id,
  placeholder,
  onSelect,
  selectedLocation,
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredLocations, setFilteredLocations] =
    useState<Location[]>(mockLocations);

  useEffect(() => {
    if (searchValue) {
      const filtered = mockLocations.filter((location) =>
        location.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(mockLocations);
    }
  }, [searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between border-slate-300 hover:bg-slate-50",
            selectedLocation ? "text-slate-900" : "text-slate-500"
          )}
        >
          {selectedLocation ? (
            <span className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-slate-500" />
              {selectedLocation.name}
            </span>
          ) : (
            <span className="flex items-center">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 shadow-md border-slate-200">
        <Command>
          <CommandInput
            placeholder="Search location..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="border-none focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center">
                <Search className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No location found.</p>
              </div>
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {filteredLocations.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.name}
                  onSelect={() => {
                    onSelect(location);
                    setOpen(false);
                  }}
                  className="flex items-center py-2"
                >
                  <MapPin className="mr-2 h-4 w-4 text-slate-500" />
                  <span className="flex-1">{location.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-green-600",
                      selectedLocation?.id === location.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
