"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import {
  Map,
  MapControls,
  MapPopup,
  useMap,
} from "@/components/ui/map";
import { useSession } from "next-auth/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchBar from "../components/searchbar";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const TYPE_LABEL_MAP: { [key: string]: string } = {
  tout: "all",
  monument: "monuments",
  maison: "houses",
  musee: "museums",
  zoo: "zoos",
  parc: "parks",
  ville: "cities",
  aeroport: "airports",
  gite: "lodgings",
  restaurant: "restaurants",
  famille: "family",
};

const MARKER_TYPES = [
  "tout", "monument", "maison", "musee", "zoo", "parc",
  "ville", "aeroport", "gite", "restaurant", "famille",
];

interface MarkerData {
  lat: number;
  lon: number;
  description: string;
  type: string;
}

interface SelectedPoint {
  coordinates: [number, number];
  properties: { description: string; type: string };
}

// ── SVG cluster layer ──────────────────────────────────────────────────────────
// Uses MapLibre GL's native GeoJSON clustering:
//  - Clusters → blue circles with count label
//  - Individual points → the original /public/map/{type}.svg icons
function SvgClusterLayer({
  data,
  onPointClick,
  clusterColors = ["#60a5fa", "#3b82f6", "#1d4ed8"],
  clusterThresholds = [10, 50],
}: {
  data: GeoJSON.FeatureCollection<GeoJSON.Point, { description: string; type: string }>;
  onPointClick?: (
    feature: GeoJSON.Feature<GeoJSON.Point, { description: string; type: string }>,
    coordinates: [number, number]
  ) => void;
  clusterColors?: [string, string, string];
  clusterThresholds?: [number, number];
}) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `svg-cluster-src-${id}`;
  const clusterLayerId = `svg-clusters-${id}`;
  const clusterCountLayerId = `svg-cluster-count-${id}`;
  const unclusteredLayerId = `svg-unclustered-${id}`;
  const onPointClickRef = useRef(onPointClick);
  onPointClickRef.current = onPointClick;

  // Set up sources, layers, and event handlers
  useEffect(() => {
    if (!isLoaded || !map) return;
    let isMounted = true;

    // ── handlers (stable refs for cleanup) ────────────────────────────────────
    const handleClick = (e: any) => {
      // Cluster click → zoom in
      const clusterFeatures = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId],
      });
      if (clusterFeatures.length > 0) {
        const clusterId = clusterFeatures[0].properties?.cluster_id;
        const source = map.getSource(sourceId) as any;
        source?.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          const coords = (clusterFeatures[0].geometry as GeoJSON.Point)
            .coordinates as [number, number];
          map.easeTo({ center: coords, zoom });
        });
        return;
      }

      // Individual point click → open popup
      const pointFeatures = map.queryRenderedFeatures(e.point, {
        layers: [unclusteredLayerId],
      });
      if (pointFeatures.length > 0) {
        const feature = pointFeatures[0] as unknown as GeoJSON.Feature<
          GeoJSON.Point,
          { description: string; type: string }
        >;
        const coords = (feature.geometry as GeoJSON.Point)
          .coordinates as [number, number];
        onPointClickRef.current?.(feature, coords);
      }
    };

    const setCursorPointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const clearCursor = () => { map.getCanvas().style.cursor = ""; };

    async function setup() {
      if (!map || !isMounted) return;

      // Load SVG images for each marker type
      await Promise.all(
        MARKER_TYPES.map(
          (type) =>
            new Promise<void>((resolve) => {
              if (map.hasImage(`marker-${type}`)) return resolve();
              const img = new Image(32, 32);
              img.onload = () => {
                try {
                  if (!map.hasImage(`marker-${type}`)) {
                    map.addImage(`marker-${type}`, img);
                  }
                } catch { /* already added */ }
                resolve();
              };
              img.onerror = () => resolve();
              img.src = `/map/${type}.svg`;
            })
        )
      );

      if (!isMounted || !map) return;

      // GeoJSON source with clustering
      map.addSource(sourceId, {
        type: "geojson",
        data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circle layer
      map.addLayer({
        id: clusterLayerId,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            clusterColors[0], clusterThresholds[0],
            clusterColors[1], clusterThresholds[1],
            clusterColors[2],
          ],
          "circle-radius": [
            "step", ["get", "point_count"],
            20, clusterThresholds[0],
            30, clusterThresholds[1],
            40,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.85,
        },
      });

      // Cluster count label
      map.addLayer({
        id: clusterCountLayerId,
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: { "text-color": "#fff" },
      });

      // Individual point layer using SVG icons
      map.addLayer({
        id: unclusteredLayerId,
        type: "symbol",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": ["concat", "marker-", ["get", "type"]],
          "icon-size": 1,
          "icon-allow-overlap": true,
          "icon-anchor": "bottom",
        },
      });

      // Events
      map.on("click", handleClick as any);
      map.on("mouseenter", clusterLayerId, setCursorPointer as any);
      map.on("mouseleave", clusterLayerId, clearCursor as any);
      map.on("mouseenter", unclusteredLayerId, setCursorPointer as any);
      map.on("mouseleave", unclusteredLayerId, clearCursor as any);
    }

    setup();

    return () => {
      isMounted = false;
      try {
        map.off("click", handleClick as any);
        map.off("mouseenter", clusterLayerId, setCursorPointer as any);
        map.off("mouseleave", clusterLayerId, clearCursor as any);
        map.off("mouseenter", unclusteredLayerId, setCursorPointer as any);
        map.off("mouseleave", unclusteredLayerId, clearCursor as any);
        if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
        if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
        if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore during style reload */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map, sourceId]);

  // Reactively update data without rebuilding layers
  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as any;
    source?.setData(data);
  }, [isLoaded, map, data, sourceId]);

  return null;
}

// ── Admin click handler ────────────────────────────────────────────────────────
function LocationMarker({
  onMapClick,
}: {
  onMapClick: (lngLat: { lng: number; lat: number }) => void;
}) {
  const { map, isLoaded } = useMap();
  const { data: session, status } = useSession();
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (status !== "authenticated") return;

    const userEmail = session?.user?.email;
    if (userEmail !== process.env.NEXT_PUBLIC_APP_ADMIN_EMAIL) return;

    const handler = (e: { lngLat: { lat: number; lng: number }; originalEvent: MouseEvent }) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest(".search-bar")) return;
      onMapClickRef.current(e.lngLat);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("click", handler as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("click", handler as any);
    };
  }, [map, isLoaded, status, session]);

  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MapComponent() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "monument" });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);

  const t = useTranslations("Map");

  const handleSave = async () => {
    if (!clickedLocation) return;
    const newMarker: MarkerData = {
      lat: clickedLocation.lat,
      lon: clickedLocation.lng,
      description: form.description,
      type: form.type,
    };
    setOpen(false);

    const res = await fetch("/api/markers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMarker),
    });
    if (res.status !== 200) {
      console.error("Failed to save marker", res.status);
      return;
    }
    setMarkers((prev) => [...prev, newMarker]);
    setForm({ title: "", description: "", type: "monument" });
  };

  useEffect(() => {
    fetch("/api/markers")
      .then((res) => res.json())
      .then((data: MarkerData[]) => {
        setMarkers(data);
        const types = Array.from(new Set(data.map((m) => m.type)));
        setSelectedTypes(types);
      });
  }, []);

  const filteredMarkers = markers.filter((m) => selectedTypes.includes(m.type));
  const availableTypes = Array.from(new Set(markers.map((m) => m.type)));

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getTypeLabel = (type: string) => t(TYPE_LABEL_MAP[type] || type);

  const geoJsonData: GeoJSON.FeatureCollection<
    GeoJSON.Point,
    { description: string; type: string }
  > = {
    type: "FeatureCollection",
    features: filteredMarkers.map((m) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [m.lon, m.lat] },
      properties: { description: m.description, type: m.type },
    })),
  };

  return (
    <section className="h-full w-full">
      <Map center={[2.3522219, 48.856614]} zoom={6}>
        <SvgClusterLayer
          data={geoJsonData}
          clusterColors={["#60a5fa", "#3b82f6", "#1d4ed8"]}
          clusterThresholds={[10, 50]}
          onPointClick={(feature, coordinates) => {
            setSelectedPoint({ coordinates, properties: feature.properties });
          }}
        />

        {selectedPoint && (
          <MapPopup
            key={`${selectedPoint.coordinates[0]}-${selectedPoint.coordinates[1]}`}
            longitude={selectedPoint.coordinates[0]}
            latitude={selectedPoint.coordinates[1]}
            onClose={() => setSelectedPoint(null)}
            closeButton
            closeOnClick={false}
            focusAfterOpen={false}
          >
            <div className="space-y-1 p-2">
              <strong className="text-sm">{selectedPoint.properties.description}</strong>
              <p className="text-xs text-muted-foreground capitalize">
                {getTypeLabel(selectedPoint.properties.type)}
              </p>
            </div>
          </MapPopup>
        )}

        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showLocate
          showFullscreen
        />

        <LocationMarker
          onMapClick={(lngLat) => {
            setClickedLocation(lngLat);
            setOpen(true);
          }}
        />

        <SearchBar />

        <div className="absolute top-24 right-2 z-[400]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-zinc-950/50 bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800/60 shadow-md"
              >
                <FilterIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t("filter-markers")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleType(type)}
                >
                  {getTypeLabel(type)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Map>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("add-location")}</DialogTitle>
            <DialogDescription>
              {t("add-location-description")} (
              {clickedLocation?.lat.toFixed(4)}, {clickedLocation?.lng.toFixed(4)}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t("description")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">{t("all")}</SelectItem>
                <SelectItem value="monument">{t("monuments")}</SelectItem>
                <SelectItem value="maison">{t("houses")}</SelectItem>
                <SelectItem value="musee">{t("museums")}</SelectItem>
                <SelectItem value="zoo">{t("zoos")}</SelectItem>
                <SelectItem value="parc">{t("parks")}</SelectItem>
                <SelectItem value="ville">{t("cities")}</SelectItem>
                <SelectItem value="aeroport">{t("airports")}</SelectItem>
                <SelectItem value="gite">{t("lodgings")}</SelectItem>
                <SelectItem value="restaurant">{t("restaurants")}</SelectItem>
                <SelectItem value="famille">{t("family")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-between w-full gap-2 mt-4">
              <Button onClick={handleSave}>{t("save")}</Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
