import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MapPin, Maximize2 } from "lucide-react";
import { buildImageSrc } from "../utils/satelliteFormatters";

// SatelliteMap renders a Leaflet map with the farm location marker and,
// when available, overlays the satellite base64 image on the bounding box.
// React-Leaflet is imported dynamically to avoid SSR issues with Leaflet.
export default function SatelliteMap({ image, farm, className = "" }) {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlayRef = useRef(null);

  const lat = farm?.latitude;
  const lon = farm?.longitude;
  const bbox = image?.bbox; // [west, south, east, north]
  const imageSrc = buildImageSrc(image?.imageBase64, image?.mimeType);

  useEffect(() => {
    if (!lat || !lon || typeof window === "undefined") return;

    // Dynamic import of Leaflet (browser only)
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        // Map already initialised — just move to new centre if changed
        mapInstanceRef.current.setView([lat, lon], 13);
      } else {
        const map = L.map(mapRef.current, {
          center: [lat, lon],
          zoom: 13,
          zoomControl: true,
          attributionControl: true,
        });

        // Satellite tile layer (Esri World Imagery)
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Tiles © Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, i-cubed",
            maxZoom: 18,
          }
        ).addTo(map);

        // Farm location marker
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;background:#2c6838;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([lat, lon], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${farm?.farmName || "Farm"}</strong><br/>${farm?.crop ? `Crop: ${farm.crop}` : ""}`,
            { className: "farm-popup" }
          );

        mapInstanceRef.current = map;
      }

      // Add / update satellite image overlay
      if (bbox && imageSrc) {
        if (overlayRef.current) {
          overlayRef.current.remove();
        }
        const bounds = [
          [bbox[1], bbox[0]], // [south, west]
          [bbox[3], bbox[2]], // [north, east]
        ];
        overlayRef.current = L.imageOverlay(imageSrc, bounds, { opacity: 0.75 }).addTo(
          mapInstanceRef.current
        );
      }
    });

    return () => {
      // Cleanup handled by mapInstanceRef persistence (no destroy on unmount
      // to preserve zoom level when re-rendering with new data)
    };
  }, [lat, lon, imageSrc, bbox, farm]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm ${className}`}
    >
      {/* Map container */}
      <div ref={mapRef} className="h-96 w-full sm:h-[480px]" />

      {/* Overlay badges */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{farm?.farmName || t("satellite.map.farmLocation")}</span>
      </div>

      {imageSrc && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-brand-600/80 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("satellite.map.overlayActive")}</span>
        </div>
      )}
    </motion.div>
  );
}
