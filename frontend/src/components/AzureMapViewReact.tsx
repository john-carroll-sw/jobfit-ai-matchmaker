import React, { useEffect, useState } from "react";
import { AzureMap, AzureMapHtmlMarker, AzureMapsProvider, type ControlOptions } from "react-azure-maps";
import { AuthenticationType } from "azure-maps-control";
import "./MapView.css"; // Import the custom CSS with forced-colors-mode fixes
import { getSupplyChainState } from "../api/supplyChainApi";
import type { SupplyChainNode } from "../types/supplyChain";

// Create a custom stylesheet to handle forced-colors-mode
const forcedColorsStylesheet = document.createElement('style');
forcedColorsStylesheet.innerHTML = `
  @media (forced-colors: active) {
    .azure-map-control {
      forced-color-adjust: auto;
    }
  }
`;
document.head.appendChild(forcedColorsStylesheet);

const mapOptions = {
  authOptions: {
    authType: AuthenticationType.subscriptionKey,
    subscriptionKey: import.meta.env.VITE_AZURE_MAPS_KEY,
  },
  center: [0, 20], // Center over the world (longitude, latitude)
  zoom: 1.5,       // Zoomed out for a global view
  view: "Auto",
  style: "grayscale_light",
  // Add support for forced colors mode
  renderOptions: {
    preserveDrawingBuffer: true,
    forcedColorSchemeAware: true,
  }
};

const AzureMapView: React.FC = () => {
  const [nodes, setNodes] = useState<SupplyChainNode[]>([]);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const state = await getSupplyChainState();
        setNodes(state.nodes);
      } catch {
        // Optionally handle error
      }
    };
    fetchNodes();
  }, []);

  return (
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
        {nodes.map((node) => (
          <AzureMapHtmlMarker
            key={node.id}
            options={{
              color:
                node.type === "factory"
                  ? "#1976d2"
                  : node.type === "distribution_center"
                  ? "#43a047"
                  : "#fbc02d",
              text: node.name,
              position: [node.location.lng, node.location.lat],
            }}
          />
        ))}
      </AzureMap>
    </AzureMapsProvider>
  );
};

export default AzureMapView;
