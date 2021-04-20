import esriConfig from '@arcgis/core/config.js';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import ArcGISMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import { useEffect, useRef, useState } from 'react';
import { readRemoteFile } from 'react-papaparse';
import './App.css';

// Generates the points on the map
function generateGraphicsLayerWithPoints(points) {
  const graphicsLayer = new GraphicsLayer();

  // ----- Task 3: Change symbology of the CSV layer -----
  const simpleMarkerSymbol = {
    type: 'simple-marker',
    color: [0, 0, 0],
    size: 3,
    outline: {
      color: [255, 255, 255],
      width: 1,
    },
  };

  if (points) {
    // Add points to the graphics layer
    points.map((currentPoint) => {
      if (currentPoint[0] && currentPoint[1]) {
        graphicsLayer.add(
          new Graphic({
            geometry: {
              type: 'point',
              longitude: currentPoint[1],
              latitude: currentPoint[2],
            },
            attributes: {
              countryCode: currentPoint[0],
            },
            symbol: simpleMarkerSymbol,
          }),
        );
        return '';
      }
    });
  }

  return graphicsLayer;
}

// React function component
function App() {
  const [csvData, setCSVData] = useState();
  const [borderPoints, setBorderPoints] = useState([]);

  // Set ESRI configurations
  esriConfig.assetsPath = './assets';
  esriConfig.apiKey = process.env.ESRI_API_KEY;

  // Ref of map
  const mapDiv = useRef(null);

  // ----- Task 4:  List data by attribute -----
  function logLocationData(csvData) {
    if (csvData) {
      const austrianBorderPoints = csvData.filter((point) => point[0] === 'AT');
      console.log('Austrian border points: ', austrianBorderPoints);

      // Remove country code and set state
      const borderPointsWithoutCountryCode = austrianBorderPoints.map(
        (borderPoint) => {
          return [borderPoint[1], borderPoint[2]];
        },
      );
      setBorderPoints(borderPointsWithoutCountryCode);
    }
  }

  // ----- Bonus Task: Assemble a country outline -----
  // Todo: Ordering points. Propably by using a geometryEngine and function nearestCoordinates()
  function createBorder() {
    if (borderPoints) {
      const polyline = {
        type: 'polyline',
        paths: borderPoints,
      };

      var polylineSymbol = {
        type: 'simple-line',
        color: [100, 80, 40],
        width: 3,
      };

      var polylineGraphic = new Graphic({
        geometry: polyline,
        symbol: polylineSymbol,
      });

      return polylineGraphic;
    }
  }

  // ----- Task 2: : Load the CSV Data into a map layer -----
  // Read the CSV file with points data
  useEffect(() => {
    readRemoteFile(
      'https://austria.maps.arcgis.com/sharing/rest/content/items/81b6dd9c931e45ec82022a2b9cd18ca0/data',
      {
        complete: (results) => {
          // Removes the header line
          results.data.shift();

          // generates points -> array of arrays
          const points = results.data.map((currentPoint, index) => {
            return [currentPoint[1], currentPoint[2], currentPoint[3]];
          });
          setCSVData(points);
        },
      },
    );
  }, []);

  useEffect(() => {
    if (mapDiv.current) {
      // ----- Task 1: Create a simple map -----
      const map = new ArcGISMap({
        basemap: 'gray-vector',
      });

      const view = new MapView({
        map,
        container: mapDiv.current,
        center: [12.421308, 48.975855],
        zoom: 3,
      });

      // ----- Task 2: : Load the CSV Data into a map layer -----
      // Draw points on a graphics layer
      const layer = generateGraphicsLayerWithPoints(csvData);

      // Log long, lat and country code to console
      logLocationData(csvData);

      // Generate polyline for Austrian border
      const austrianBorderLine = createBorder();

      layer.add(austrianBorderLine);

      // Add the GraphicsLayer instance to the map
      map.addMany([layer]);
    }
  }, [csvData]);

  return <div className="mapDiv" ref={mapDiv} />;
}

export default App;
