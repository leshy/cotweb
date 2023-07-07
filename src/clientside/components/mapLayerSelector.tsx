import React from 'react';
import './mapLayerSelector.css';

import { MapLayer } from '../types';

export function MapLayerSelector({ mapLayer, setMapLayer }: { setMapLayer: Function, mapLayer: string }) {
    const layers = [MapLayer.Sat, MapLayer.Stamen, MapLayer.Street].map(
        (layerName) => (
            <div key={layerName}
                onClick={() => setMapLayer(layerName)}
                className={(layerName == mapLayer) ? "selectedLayer" : "layer"}>
                {layerName}
            </div>
        )
    )
    return <div className="mapLayerContainer">
        {layers}
    </div>
}

export default MapLayerSelector
