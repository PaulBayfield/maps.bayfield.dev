"use client";

import { useMap } from "react-leaflet";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
let L: typeof import("leaflet");
if (typeof window !== "undefined") {
  L = require("leaflet");
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeMarkerData, setActiveMarkerData] = useState<any>(null);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const map = useMap();
  const resultsRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("SearchBar");

  const handleSearch = async (q: string) => {
    setTempMarker(null);
    setActiveMarkerData(null);
    setQuery(q);

    if (!q || q.length < 2) return setResults([]);
    const { lat, lng } = map.getCenter();
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(q)}&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}`
    );
    const data = await res.json();
    const features = data.features || [];

    const uniqueFeatures = features.filter(
      (f: { properties: { name: any; type: any; }; geometry: { coordinates: number[]; }; }, i: any, arr: any[]) =>
        arr.findIndex(
          (x) =>
            x.properties.name === f.properties.name &&
            x.properties.type === f.properties.type &&
            Math.round(x.geometry.coordinates[0] * 100000) ===
              Math.round(f.geometry.coordinates[0] * 100000) &&
            Math.round(x.geometry.coordinates[1] * 100000) ===
              Math.round(f.geometry.coordinates[1] * 100000)
        ) === i
    );

    setResults(uniqueFeatures);
    setActiveIndex(-1);
  };

  const handleSelect = (place: any) => {
    const [lon, lat] = place.geometry.coordinates;
    map.setView([lat, lon], 15);
    setQuery(place.properties.name || "");
    setActiveMarkerData(place);
    setResults([]);
    setTempMarker([lat, lon]); // Set temporary marker
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setResults([]);
    }
  };

  useEffect(() => {
    if (resultsRef.current && activeIndex >= 0) {
      const el = resultsRef.current.children[activeIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <>
      <div className="search-bar absolute top-25 left-2 z-600 w-50 sm:w-60 md:w-70 lg:w-80
      bg-white dark:bg-zinc-900 shadow-md rounded-md p-2 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-zinc-950/50 bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <Input
          value={query}
          placeholder={t("placeholder")}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {results.length > 0 && (
          <Card className="mt-2 max-h-60 overflow-auto shadow-lg py-0 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-zinc-950/50 bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <CardContent ref={resultsRef} className="p-0">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    i === activeIndex ? "bg-gray-200 dark:bg-gray-700" : ""
                  }`}
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <strong>
                    {r.properties.name || r.properties.street || t("unnamed")}
                  </strong>
                  {r.properties.city ? `, ${r.properties.city}` : ""}
                  {r.properties.type ? ` (${r.properties.type})` : ""}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {tempMarker && (
        <Marker
          position={tempMarker}
          icon={L.icon(
            { 
              iconUrl: "/map/tout.svg", 
              iconSize: [32, 32],
              iconAnchor: [15, 30],
              popupAnchor: [1, -30],
            }
          )}
          eventHandlers={{
            click: () => {
              map.setView(tempMarker, 15);
            },
          }}
        >
          <Popup>
            <div>
              <strong>{activeMarkerData?.properties.name || t("unnamed")}</strong>
              <br />
              {activeMarkerData?.properties.state || t("unnamed")}
              <br />
              {activeMarkerData?.properties.county || t("unnamed")}
              <br />
              {activeMarkerData?.properties.postcode || t("unnamed")}
              <br />
              {activeMarkerData?.properties.city || ""}
              {activeMarkerData?.properties.type
                ? ` (${activeMarkerData.properties.type})`
                : ""}
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
