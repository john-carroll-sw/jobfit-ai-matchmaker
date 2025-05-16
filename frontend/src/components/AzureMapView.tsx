import React, { useEffect, useRef } from 'react';
import './MapView.css';

// Add TypeScript declaration for the global function
declare global {
  interface Window {
    initAzureMap: (container: HTMLDivElement) => void;
    AZURE_MAPS_KEY: string;
    resizeMap: () => void;
    destroyAzureMap?: () => void;
  }
}

const AzureMapView: React.FC = () => {
  const mapDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject the API key into the window object for the vanilla JS file to use
    window.AZURE_MAPS_KEY = import.meta.env.VITE_AZURE_MAPS_KEY as string;

    // Helper to load a script only once
    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        
        // For CSS files, create link element instead of script
        if (src.endsWith('.css')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = src;
          link.onload = () => resolve();
          link.onerror = () => reject();
          document.head.appendChild(link);
          return;
        }
        
        // For JS files, create script element
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.body.appendChild(script);
      });
    }

    // Load Azure Maps SDK and our vanilla JS logic, then initialize
    async function setupMap() {
      try {
      // Load the CSS first (do not await, just inject)
      loadScript('https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css');
      // Load the Azure Maps SDK (await)
      await loadScript('https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js');
      // Load our custom map implementation (await)
      await loadScript('/azureMapVanilla.js');

      // Initialize the map if the function and container are available
      if (window.initAzureMap && mapDivRef.current) {
        window.initAzureMap(mapDivRef.current);
      } else {
        console.error('Azure Maps initialization failed: Missing initAzureMap function or map container');
      }
      } catch (error) {
      console.error('Failed to load Azure Maps resources:', error);
      }
    }
    
    setupMap();

    // Handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      if (window.resizeMap) {
        window.resizeMap();
      }
    });
    
    if (mapDivRef.current) {
      resizeObserver.observe(mapDivRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (window.destroyAzureMap) {
        window.destroyAzureMap();
      }
    };
  }, []);

  return (
    <div
      ref={mapDivRef}
      id="myMap"
      className="azure-map-container"
      aria-label="Azure Map"
    />
  );
};

export default AzureMapView;
