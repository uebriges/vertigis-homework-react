import esriConfig from '@arcgis/core/config.js';
import Graphic from '@arcgis/core/Graphic';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import ArcGISMap from '@arcgis/core/Map';
import DictionaryRenderer from '@arcgis/core/renderers/DictionaryRenderer';
import MapView from '@arcgis/core/views/MapView';
import { useEffect, useRef, useState } from 'react';
import { readRemoteFile } from 'react-papaparse';
import './App.css';

// Generates the points on the map
function pointsGenerator(points) {
  console.log('points: ', points);
  const graphicsLayer = new GraphicsLayer();
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

async function logLocationData(graphicsLayer) {
  // await graphicsLayer.load().then((data) => console.log('data: ', data));
  // const layer = await graphicsLayer.load();
  // console.log('layer in log: ', layer.graphics.items[0].geometry.longitude);
}

// React function component
function App() {
  const [csvData, setCSVData] = useState();

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

  esriConfig.assetsPath = './assets';
  esriConfig.apiKey = process.env.ESRI_API_KEY;

  const mapDiv = useRef(null);

  useEffect(() => {
    if (mapDiv.current) {
      /**
       * Initialize application
       */
      const map = new ArcGISMap({
        basemap: 'gray-vector',
      });

      const view = new MapView({
        map,
        container: mapDiv.current,
        center: [12.421308, 48.975855],
        zoom: 3,
      });

      const scale = 36112;
      const layer1 = new FeatureLayer({
        url:
          'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Alternative_Fuel_Station_March2018/FeatureServer',
        outFields: ['*'],
        renderer: new DictionaryRenderer({
          url:
            'https://jsapi.maps.arcgis.com/sharing/rest/content/items/30cfbf36efd64ccf92136201d9e852af',
          fieldMap: {
            fuel_type: 'Fuel_Type_Code',
          },
          config: {
            show_label: 'false',
          },
          visualVariables: [
            {
              type: 'size',
              valueExpression: '$view.scale',
              stops: [
                { value: scale / 2, size: 20 },
                { value: scale * 2, size: 15 },
                { value: scale * 4, size: 10 },
                { value: scale * 8, size: 5 },
                { value: scale * 16, size: 2 },
                { value: scale * 32, size: 1 },
              ],
            },
          ],
        }),
        minScale: 0,
        maxScale: 10000,
      });

      const layer2 = new FeatureLayer({
        url:
          'https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Alternative_Fuel_Station_March2018/FeatureServer',
        outFields: ['*'],
        renderer: new DictionaryRenderer({
          url:
            'https://jsapi.maps.arcgis.com/sharing/rest/content/items/30cfbf36efd64ccf92136201d9e852af',
          fieldMap: {
            fuel_type: 'Fuel_Type_Code',
            connector_types: 'EV_Connector_Types',
            network: 'EV_Network',
            name: 'Station_Name',
          },
          config: {
            show_label: 'true',
          },
        }),
        minScale: 10000,
        maxScale: 0,
      });

      const layer = pointsGenerator(csvData);
      console.log('graphicsLayer: ', layer);

      logLocationData(layer);

      map.addMany([layer]);
    }
  }, [csvData]);

  return <div className="mapDiv" ref={mapDiv} />;
}

export default App;
