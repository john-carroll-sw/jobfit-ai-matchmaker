import React from "react";
import { AzureMap, AzureMapHtmlMarker, AzureMapsProvider, type ControlOptions } from "react-azure-maps";
import { AuthenticationType } from "azure-maps-control";

const mapOptions = {
  authOptions: {
    authType: AuthenticationType.subscriptionKey,
    subscriptionKey: import.meta.env.VITE_AZURE_MAPS_KEY,
  },
  center: [-122.4194, 37.7749],
  zoom: 11,
  view: "Auto",
  style: "grayscale_light",
};

const markerPositions = [
  [-122.4194, 37.7749], // San Francisco
  [-122.2711, 37.8044], // Oakland
  [-122.3772, 37.6194], // SFO Airport
  [-122.3321, 37.806],   // Bay Bridge midpoint
  [-122.4478, 37.8078],  // Golden Gate Bridge
  [-122.3022, 37.8688],  // Berkeley Marina
  [-122.4852, 37.8324],  // Marin Headlands
  [-122.4101, 37.7897],  // Embarcadero
  [-122.2364, 37.7749],  // Alameda
  [-122.4098, 37.8024],  // Fisherman's Wharf
];

const AzureMapExample: React.FC = () => (
  <AzureMapsProvider>
    <AzureMap
      options={mapOptions}
      styles={{ height: "100%", width: "100%", borderRadius: 8 }}
      controls={[
        { controlName: "ZoomControl", options: { position: "top-right" } as ControlOptions },
        { controlName: "CompassControl", options: { position: "top-right" } as ControlOptions },
        { controlName: "PitchControl", options: { position: "top-right" } as ControlOptions },
        { controlName: "StyleControl", options: { position: "top-left" } as ControlOptions },
        { controlName: "FullscreenControl", options: { position: "top-left" } as ControlOptions }
      ]}
    >
      {markerPositions.map((position, idx) => (
        <AzureMapHtmlMarker
          key={`html-marker-${idx}`}
          options={{
            color: 'DodgerBlue',
            text: `${idx + 1}`,
            position,
          }}
        />
      ))}
    </AzureMap>
  </AzureMapsProvider>
);

export default AzureMapExample;