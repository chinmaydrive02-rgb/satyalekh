"use client";

import React, { useState } from "react";
import Map from "@/components/Map";
import SearchWidget from "@/components/SearchWidget";
import RiskCard from "@/components/RiskCard";
import TopNav from "@/components/TopNav";

export default function Home() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);

  const handlePlotSelect = (plotOrFeature: any) => {
    if (!plotOrFeature) {
      setSelectedPlot(null);
      return;
    }
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

      {/* Floating UI Elements - pushed below fixed TopNav */}
      <div className="absolute left-6 top-[72px] z-40">
         <SearchWidget onPlotSelect={handlePlotSelect} />
      </div>

      {/* Selected Plot HUD */}
      <div className="absolute right-6 top-[72px] z-40">
        {selectedPlot && (
          <RiskCard 
            plot={selectedPlot} 
            onClose={() => setSelectedPlot(null)} 
          />
        )}
      </div>

      {/* Scanline Overlay — z-30 so it doesn't block map or UI */}
      <div className="pointer-events-none absolute inset-0 z-30 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
