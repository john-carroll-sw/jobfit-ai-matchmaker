import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapView.css";
import type { SupplyChainState } from "../types/supplyChain";
import { getSupplyChainState } from "../api/supplyChainApi";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

const MAP_CENTER: [number, number] = [-122.41, 37.78]; // San Francisco area

const MapLegend: React.FC = () => (
  <div className="map-legend">
    <div className="map-legend-row">
      <span className="node-factory map-legend-icon"></span>
      Factory
    </div>
    <div className="map-legend-row">
      <span className="node-distribution_center map-legend-icon"></span>
      Distribution Center
    </div>
    <div className="map-legend-row">
      <span className="node-retail map-legend-icon"></span>
      Retail
    </div>
  </div>
);

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [supplyChain, setSupplyChain] = useState<SupplyChainState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cache for route polylines
  const routeCache = useRef<{ [key: string]: number[][] }>({});

  // Helper to fetch driving route from Mapbox Directions API
  const fetchDrivingRoute = async (
    from: [number, number],
    to: [number, number],
    routeId: string
  ): Promise<number[][] | null> => {
    if (routeCache.current[routeId]) return routeCache.current[routeId];
    const accessToken = mapboxgl.accessToken;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${accessToken}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
        routeCache.current[routeId] = data.routes[0].geometry.coordinates;
        return data.routes[0].geometry.coordinates;
      }
    } catch (error) {
      // fallback to straight line if API fails
      console.error("Error fetching driving route:", error);
      return null;
    }
    return null;
  };

  // Fetch supply chain data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSupplyChainState();
        setSupplyChain(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching supply chain data:", err);
        setError("Failed to load supply chain data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: MAP_CENTER,
      zoom: 9,
    });

    const map = mapRef.current;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Clean up on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add supply chain data to map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !supplyChain || loading) return;

    // Clear route cache on supply chain state change (especially closedBridges)
    routeCache.current = {};

    const onLoad = async () => {
      // Remove all previous route sources and layers using public API
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer) => {
          if (layer.id.startsWith('route-') && map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        });
      }
      if (style && style.sources) {
        Object.keys(style.sources).forEach((sourceId) => {
          if (sourceId.startsWith('route-') && map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        });
      }

      // Fit map to bounds of all nodes
      const bounds = new mapboxgl.LngLatBounds();
      supplyChain.nodes.forEach((node) => {
        bounds.extend([node.location.lng, node.location.lat]);
      });
      map.fitBounds(bounds, { padding: 50 });

      // Add Oakland Bay Bridge avoidance polygon as a visible fill and outline
      const OAKLAND_BAY_BRIDGE_POLYGON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-122.38818440230241, 37.78919217338181],
                  [-122.38782249093589, 37.78812066499759],
                  [-122.38028196637966, 37.795358568549574],
                  [-122.37426031630528, 37.80093363424673],
                  [-122.36267298851001, 37.81170697825304],
                  [-122.36148117407768, 37.81273053449793],
                  [-122.35250916524069, 37.81772125489243],
                  [-122.34201615001673, 37.819396840167585],
                  [-122.32775451285596, 37.82136679684645],
                  [-122.3063412476317, 37.82409614861264],
                  [-122.30549701090455, 37.826358073073976],
                  [-122.32313026567017, 37.82335636023031],
                  [-122.33699868510735, 37.82178308846727],
                  [-122.35275867583945, 37.81932363069252],
                  [-122.36362861011031, 37.813143808265636],
                  [-122.38227049143148, 37.79504172676684],
                  [-122.38677351950994, 37.790519714366226],
                  [-122.38818440230241, 37.78919217338181]
                ]
              ]
            }
          }
        ]
      };
      const bridgePolygonSourceId = 'oakland-bay-bridge-polygon';
      if (!map.getSource(bridgePolygonSourceId)) {
        map.addSource(bridgePolygonSourceId, {
          type: 'geojson',
          data: OAKLAND_BAY_BRIDGE_POLYGON
        });
        map.addLayer({
          id: bridgePolygonSourceId,
          type: 'fill',
          source: bridgePolygonSourceId,
          layout: {},
          paint: {
            'fill-color': '#FF00FF',
            'fill-opacity': 0.3
          }
        });
        map.addLayer({
          id: bridgePolygonSourceId + '-outline',
          type: 'line',
          source: bridgePolygonSourceId,
          layout: {},
          paint: {
            'line-color': '#FF00FF',
            'line-width': 3
          }
        });
      }

      // Add routes as driving polylines
      for (const route of supplyChain.routes) {
        const fromNode = supplyChain.nodes.find((n) => n.id === route.from);
        const toNode = supplyChain.nodes.find((n) => n.id === route.to);
        if (fromNode && toNode) {
          const routeId = `route-${route.id}`;
          let coordinates: number[][] | null = null;
          coordinates = await fetchDrivingRoute(
            [fromNode.location.lng, fromNode.location.lat],
            [toNode.location.lng, toNode.location.lat],
            routeId
          );
          // Set default coordinates if null
          const routeCoordinates = coordinates || [
            [fromNode.location.lng, fromNode.location.lat],
            [toNode.location.lng, toNode.location.lat],
          ];

          const routeFeature: GeoJSON.Feature = {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeCoordinates,
            },
            properties: {
              id: route.id,
              status: route.status,
            },
          };
          if (!map.getSource(routeId)) {
            map.addSource(routeId, {
              type: "geojson",
              data: routeFeature,
            });
            map.addLayer({
              id: routeId,
              type: "line",
              source: routeId,
              layout: {},
              paint: {
                "line-color": route.status === "open" ? "rgba(34, 139, 34, 0.8)" : "rgba(220, 20, 60, 0.8)",
                "line-width": 3,
                "line-dasharray": route.status === "closed" ? [3, 3] : [1],
              },
            });
          } else {
            // update source if already exists
            (map.getSource(routeId) as mapboxgl.GeoJSONSource).setData(routeFeature);
          }
        }
      }

      // Add nodes as markers
      supplyChain.nodes.forEach((node) => {
        const el = document.createElement("div");
        el.className = `node-${node.type}`;
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="node-popup">
            <h3>${node.name}</h3>
            <p>Type: ${formatNodeType(node.type)}</p>
            ${Object.entries(node.inventory)
              .map(([sku, quantity]) => `<p>${sku}: ${quantity} units</p>`)
              .join("")}
          </div>`
        );
        new mapboxgl.Marker(el)
          .setLngLat([node.location.lng, node.location.lat])
          .setPopup(popup)
          .addTo(map);
      });
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.once("load", onLoad);
    }
    return () => {
      if (map) {
        map.off("load", onLoad);
      }
    };
  }, [supplyChain, loading]);

  // Helper to format node type for display
  const formatNodeType = (type: string): string => {
    switch (type) {
      case "factory":
        return "Factory";
      case "distribution_center":
        return "Distribution Center";
      case "retail":
        return "Retail";
      default:
        return type;
    }
  };

  return (
    <div className="map-container map-container-relative" ref={mapContainer}>
      <MapLegend />
      {loading && (
        <div className="loading-indicator">
          Loading...
        </div>
      )}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default MapView;
