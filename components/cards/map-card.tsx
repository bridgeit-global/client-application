'use client';
import { CardContent } from '../ui/card';
import React, { useState } from 'react';
import UnitCostMap from '../mapbox/unit-cost-map';

export default function MapCard({ mapData }: any) {
  const [activeMap, setActiveMap] = useState('unit');
  return (
    <>
      <CardContent className="p-2 sm:p-6">
        <UnitCostMap
          data={mapData}
          setActiveMap={setActiveMap}
          activeMap={activeMap}
        />
      </CardContent>
    </>
  );
}
