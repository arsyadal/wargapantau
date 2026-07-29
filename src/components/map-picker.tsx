"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MapPin } from "lucide-react";

// Fix for default marker icon
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface NominatimResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        road?: string;
        village?: string;
        suburb?: string;
        city?: string;
        county?: string;
        state?: string;
        country?: string;
    };
}

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
    address?: string;
    onAddressChange?: (address: string) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Component to handle map click and reverse geocoding
function LocationMarker({
    position,
    onLocationSelect
}: {
    position: L.LatLng | null;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
}) {
    const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(position);

    useEffect(() => {
        setMarkerPosition(position);
    }, [position]);

    useMapEvents({
        click: async (e) => {
            setMarkerPosition(e.latlng);

            // Reverse geocoding
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&addressdetails=1`,
                    {
                        headers: {
                            "Accept-Language": "id",
                        },
                    }
                );
                const data = await response.json();
                const address = data.display_name || "";
                onLocationSelect(e.latlng.lat, e.latlng.lng, address);
            } catch (error) {
                console.error("Reverse geocoding error:", error);
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    return markerPosition === null ? null : <Marker position={markerPosition} />;
}

// Component to pan/zoom map to location
function MapController({ lat, lng, shouldFly }: { lat: number; lng: number; shouldFly: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (shouldFly) {
            map.flyTo([lat, lng], 16, { duration: 1 });
        }
    }, [map, lat, lng, shouldFly]);

    return null;
}

export function MapPicker({
    onLocationSelect,
    initialLat,
    initialLng,
    address: externalAddress,
    onAddressChange
}: MapPickerProps) {
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState(externalAddress || "");
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<L.LatLng | null>(null);
    const [mapCenter, setMapCenter] = useState({ lat: initialLat || -6.2088, lng: initialLng || 106.8456 });
    const [shouldFlyTo, setShouldFlyTo] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useDebounce(searchQuery, 500);

    // Search for addresses
    useEffect(() => {
        const searchAddress = async () => {
            if (debouncedSearch.length < 3) {
                setSuggestions([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedSearch)}&countrycodes=id&limit=5&addressdetails=1`,
                    {
                        headers: {
                            "Accept-Language": "id",
                        },
                    }
                );
                const data: NominatimResult[] = await response.json();
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (error) {
                console.error("Geocoding search error:", error);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        };

        searchAddress();
    }, [debouncedSearch]);

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: NominatimResult) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);

        setSearchQuery(suggestion.display_name);
        setSelectedPosition(L.latLng(lat, lng));
        setMapCenter({ lat, lng });
        setShouldFlyTo(true);
        setShowSuggestions(false);

        onLocationSelect(lat, lng, suggestion.display_name);
        onAddressChange?.(suggestion.display_name);

        // Reset fly flag after animation
        setTimeout(() => setShouldFlyTo(false), 1500);
    };

    // Handle map click callback
    const handleMapLocationSelect = (lat: number, lng: number, address?: string) => {
        setSelectedPosition(L.latLng(lat, lng));
        if (address) {
            setSearchQuery(address);
            onAddressChange?.(address);
        }
        onLocationSelect(lat, lng, address);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Update search query when external address changes
    useEffect(() => {
        if (externalAddress && externalAddress !== searchQuery) {
            setSearchQuery(externalAddress);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalAddress]);

    if (!mounted) {
        return (
            <div className="space-y-3">
                <div className="h-10 w-full rounded-md bg-gray-100 animate-pulse" />
                <div className="h-[300px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">Memuat peta...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Search Input with Suggestions */}
            <div className="relative" ref={suggestionsRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Cari alamat... (contoh: Jl. Sudirman Jakarta)"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        className="pl-10 pr-10"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.place_id}
                                type="button"
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
                            >
                                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 line-clamp-2">
                                    {suggestion.display_name}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500">
                💡 Ketik alamat untuk mencari, atau klik langsung pada peta
            </p>

            {/* Map */}
            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController lat={mapCenter.lat} lng={mapCenter.lng} shouldFly={shouldFlyTo} />
                    <LocationMarker
                        position={selectedPosition}
                        onLocationSelect={handleMapLocationSelect}
                    />
                </MapContainer>
            </div>
        </div>
    );
}
