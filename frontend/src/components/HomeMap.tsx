"use client";

import { useState } from "react";
import Map, { Source, Layer, AttributionControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiY2hpbm1heTEyMDYiLCJhIjoiY21rOW5neGw3MXF1MjNkc2M2NTRpaW93dSJ9.Iyf99AosQ3obQDU6JIwFOA";
const parcel: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[
    [72.5598, 23.0388], [72.5623, 23.0388], [72.5623, 23.0368], [72.5598, 23.0368], [72.5598, 23.0388],
  ]] },
};

export default function HomeMap() {
  const [failed, setFailed] = useState(false);
  if (failed) return null; // The static backdrop and every action remain available.
  return (
    <Map
      initialViewState={{ longitude: 72.562, latitude: 23.036, zoom: 13.8, pitch: 48, bearing: -22 }}
      mapboxAccessToken={token}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      interactive={false}
      attributionControl={false}
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%" }}
    >
      <AttributionControl compact position="bottom-right" />
      <Source id="home-example-parcel" type="geojson" data={parcel}>
        <Layer id="home-parcel-fill" type="fill" paint={{ "fill-color": "#b5e7c8", "fill-opacity": 0.24 }} />
        <Layer id="home-parcel-outline" type="line" paint={{ "line-color": "#e1c990", "line-width": 3 }} />
      </Source>
    </Map>
  );
}
