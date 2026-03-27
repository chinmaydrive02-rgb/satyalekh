"use client";

import React, { useRef, useState } from 'react';
import Mapbox, { Source, Layer, MapRef, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockData } from '@/lib/mockData';

export default function Map({ onPlotSelect }: { onPlotSelect: (plot: any) => void }) {
  const mapRef = useRef<MapRef | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, feature: any } | null>(null);

  const filterPlots = ['==', 'type', 'plot'];
  const filterHeritage = ['==', 'type', 'heritage_zone'];
  const filterPipeline = ['==', 'type', 'pipeline'];
  const filterMetro = ['==', 'type', 'metro'];

  const onHover = (event: any) => {
    const feature = event.features && event.features[0];
    if (feature && feature.properties.type === 'plot') {
      setHoverInfo({
        x: event.point.x,
        y: event.point.y,
        feature: feature
      });
    } else {
      setHoverInfo(null);
    }
  };

  const onClick = (event: any) => {
    const feature = event.features && event.features[0];
    if (feature && feature.properties.type === 'plot') {
      onPlotSelect(feature.properties);
      
      if (feature.geometry.coordinates[0]) {
         const coords = feature.geometry.coordinates[0][0];
         mapRef.current?.flyTo({
           center: [coords[0], coords[1]],
           zoom: 17,
           pitch: 60,
           duration: 1500
         });
      }
    } else {
      onPlotSelect(null);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <Mapbox
        ref={mapRef}
        initialViewState={{
          longitude: 72.4925,
          latitude: 23.0345,
          zoom: 15.5,
          pitch: 45,
          bearing: -17.6
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken="pk.eyJ1IjoiY2hpbm1heTEyMDYiLCJhIjoiY21rOW5neGw3MXF1MjNkc2M2NTRpaW93dSJ9.Iyf99AosQ3obQDU6JIwFOA"
        interactiveLayerIds={['plots-fill']}
        onClick={onClick}
        onMouseMove={onHover}
        cursor={hoverInfo ? 'pointer' : 'auto'}
      >
        <NavigationControl position="bottom-right" />

        <Source id="satya-data" type="geojson" data={mockData}>
          {/* Layer 1: Plots Polygon Fill */}
          <Layer
            id="plots-fill"
            type="fill"
            filter={filterPlots}
            paint={{
              'fill-color': ['get', 'risk_color'],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.8,
                0.4
              ]
            }}
          />
          {/* Layer 1: Plots Polygon Outline */}
          <Layer
            id="plots-line"
            type="line"
            filter={filterPlots}
            paint={{
              'line-color': ['get', 'risk_color'],
              'line-width': 2
            }}
          />

          {/* Layer 2: Heritage Zone Red Circle */}
          <Layer
            id="heritage-circle"
            type="circle"
            filter={filterHeritage}
            paint={{
              'circle-radius': { "base": 2, "stops": [[12, 10], [16, 200]] },
              'circle-color': '#ba1b24',
              'circle-opacity': 0.2,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ba1b24',
            }}
          />

          {/* Layer 3: Infrastructure Pipeline */}
          <Layer
            id="pipeline-line"
            type="line"
            filter={filterPipeline}
            paint={{
              'line-color': '#eab308', /* Yellow for pipeline */
              'line-width': 4,
              'line-dasharray': [2, 1]
            }}
          />

          {/* Layer 3: Infrastructure Metro Zone */}
          <Layer
            id="metro-line"
            type="line"
            filter={filterMetro}
            paint={{
              'line-color': '#3b82f6', /* Blue for metro */
              'line-width': 10,
              'line-opacity': 0.4
            }}
          />
        </Source>

        {hoverInfo && (
          <div
            style={{
              position: 'absolute',
              left: hoverInfo.x,
              top: hoverInfo.y - 10,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none'
            }}
            className="glass-panel px-3 py-2 text-xs font-bold text-[#dbfcff] border-none uppercase tracking-widest z-50 whitespace-nowrap"
          >
            SURVEY NO: {hoverInfo.feature.properties.survey_number}
          </div>
        )}
      </Mapbox>
    </div>
  );
}
