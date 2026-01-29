"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapPoint {
  place_id: string;
  place_name: string;
  lat: number;
  lng: number;
  check_in_count: number;
  happy_tags: string[];
  latest_note: string | null;
  latest_photo_url: string | null;
  cautions: string[];
}

interface MapComponentProps {
  points: MapPoint[];
  onPointSelect: (point: MapPoint | null) => void;
  selectedPoint: MapPoint | null;
}

function MapController({
  selectedPoint,
}: {
  selectedPoint: MapPoint | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPoint) {
      map.setView([selectedPoint.lat, selectedPoint.lng], 15);
    }
  }, [selectedPoint, map]);

  return null;
}

export default function MapComponent({
  points,
  onPointSelect,
  selectedPoint,
}: MapComponentProps) {
  // Default center (Taipei)
  const defaultCenter: [number, number] = [25.033, 121.5654];

  // Calculate center based on points or use default
  const center: [number, number] =
    points.length > 0
      ? [
          points.reduce((sum, p) => sum + p.lat, 0) / points.length,
          points.reduce((sum, p) => sum + p.lng, 0) / points.length,
        ]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedPoint={selectedPoint} />
      {points.map((point) => (
        <Marker
          key={point.place_id}
          position={[point.lat, point.lng]}
          eventHandlers={{
            click: () => onPointSelect(point),
          }}
        >
          <Popup>
            <strong>{point.place_name}</strong>
            <br />
            打卡 {point.check_in_count} 次
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
