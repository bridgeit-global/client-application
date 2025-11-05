'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export function SiteConsumptionMap() {
  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Consumption</CardTitle>
          <CardDescription>
            Showing total consumption for all sites
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <iframe
          width="100%"
          height="400px"
          src="https://api.mapbox.com/styles/v1/shubham666/cm35t53hj00q601qt85eecsok.html?title=false&access_token=pk.eyJ1Ijoic2h1YmhhbTY2NiIsImEiOiJjbHpwcWxidXIwbWc3MmpzMzNzcngzdHc4In0.lBYP1CxKcSie6wJZd4nQGg&zoomwheel=false#5/27.57/80"
          title="battery-smart"
        ></iframe>
      </CardContent>
    </Card>
  );
}
