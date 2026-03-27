"use client";

import React, { useState } from "react";
import Map from "@/components/Map";
import SearchWidget from "@/components/SearchWidget";
import RiskCard from "@/components/RiskCard";
import TopNav from "@/components/TopNav";

export default function Home() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);

  const handlePlotSelect = (plotOrFeature: any) => {
    // Determine if it passed the full geojson feature or just properties
    if (!plotOrFeature) {
      setSelectedPlot(null);
      return;
    }
    
    // Check if what got passed is the full feature object from mockData
    if (plotOrFeature.properties) {
       setSelectedPlot(plotOrFeature.properties);
    } else {
       setSelectedPlot(plotOrFeature);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a]">
      <TopNav />
      {/* Background Map layer */}
      <Map onPlotSelect={handlePlotSelect} />

      {/* Floating UI Elements */}
      <div className="absolute left-8 top-24 z-40">
         <SearchWidget onPlotSelect={handlePlotSelect} />
      </div>

      {/* Selected Plot HUD */}
      <div className="absolute right-8 top-24 z-40">
        {selectedPlot && (
          <RiskCard 
            plot={selectedPlot} 
            onClose={() => setSelectedPlot(null)} 
          />
        )}
      </div>

      {/* Scanline Overlay for Cyberpunk Feel */}
      <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
