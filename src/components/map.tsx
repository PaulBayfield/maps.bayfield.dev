"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
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

let L: typeof import("leaflet");
if (typeof window !== "undefined") {
  L = require("leaflet");
}
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-markercluster").then((mod) => mod.default),
  { ssr: false }
) as any;

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import 'react-leaflet-markercluster/styles'
import { useTranslations } from "next-intl";

export default function Map() {
  const [markers, setMarkers] = useState<any[]>([]);
  const [clickedLocation, setClickedLocation] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "monument",
  });

  const t = useTranslations("Map");

  function LocationMarker() {
    const { data: session, status } = useSession();

    useMapEvents({
      click(e) {
        if (status !== "authenticated") return;

        const userEmail = session.user?.email;
        if (userEmail !== process.env.NEXT_PUBLIC_APP_ADMIN_EMAIL) return;

        const target = e.originalEvent.target as HTMLElement;
        if (target.closest(".search-bar")) return;

        setClickedLocation(e.latlng);
        setOpen(true);
      },
    });
    return null;
  }


  const handleSave = async () => {
    if (!clickedLocation) return;
    const newMarker = {
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
    setForm(
      {
        title: "",
        description: "",
        type: "monument",
      }
    );
  };

  useEffect(() => {
    fetch("/api/markers")
      .then((res) => res.json())
      .then((data) => setMarkers(data));
  }, []);

  return (
    <section className="h-full w-full">
      <MapContainer
        center={[48.856614, 2.3522219]}
        zoom={6}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        />

        <MarkerClusterGroup chunkedLoading>
          {markers.map((m, i) => (
            <Marker key={i} position={[m.lat, m.lon]} icon={
              L.icon({
                iconUrl: `/map/${m.type}.svg`,
                iconSize: [32, 32],
                iconAnchor: [15, 30],
                popupAnchor: [1, -30],
              })
            }>
              <Popup>
                <strong>{m.description}</strong> <br />
                Type: {m.type}
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        <ZoomControl position="bottomright" />
        <LocationMarker />
        <SearchBar/>
      </MapContainer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("add-location")}</DialogTitle>
            <DialogDescription>
              {t("add-location-description")} ({clickedLocation?.lat.toFixed(4)}, {clickedLocation?.lng.toFixed(4)}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t("description")}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
