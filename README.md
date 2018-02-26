# YAGA cached Tile-Layer for Leaflet

[![Build Status](https://travis-ci.org/yagajs/leaflet-cached-tile-layer.svg?branch=develop)](https://travis-ci.org/yagajs/leaflet-cached-tile-layer)
[![Coverage Status](https://coveralls.io/repos/github/yagajs/leaflet-cached-tile-layer/badge.svg?branch=develop)](https://coveralls.io/github/yagajs/leaflet-cached-tile-layer?branch=develop)

A cached tile-layer for [Leaflet](http://leafletjs.com/) realized with the browsers IndexedDB over
[@yaga/indexed-db-tile-cache](https://www.npmjs.com/package/@yaga/indexed-db-tile-cache).

## How to use

At first you have to install this library with `npm` or `yarn`:

```bash
npm install --save @yaga/leaflet-cached-tile-layer
# OR
yarn install --save @yaga/leaflet-cached-tile-layer
```

After that you can import this module into your application with the typical node.js or TypeScript way.

*keep in mind that you have to use browserify to package the libraries from the node.js environment into your browser
ones, such as `Buffer` or `request`.*

### Working with the cached Leaflet tile layer

#### JavaScript
```javascript
const CachedTileLayer = require('@yaga/leaflet-cached-tile-layer').CachedTileLayer;
const Map = require('leaflet').Map;

document.addEventListener('DOMContentLoaded', function() {
    const map = new Map('map').setView([51.505, -0.09], 13);

    const leafletCachedTileLayer = new CachedTileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        databaseName: 'tile-cache-data', // optional
        databaseVersion: 1, // optional
        objectStoreName: 'OSM', // optional
        crawlDelay: 500, // optional
        maxAge: 1000 * 60 * 60 * 24 * 7 // optional
    }).addTo(map);

    // The layer caches itself on tile load.
    // You can also seed explicit with:
    // - `leafletCachedTileLayer.seedCurrentView();`
    // - `leafletCachedTileLayer.seedBBox(/* ... */);`
    //
    // or clear the cache with:
    // - `leafletCachedTileLayer.clearCache();`
});

```

#### TypeScript
```typescript
import { CachedTileLayer, ICachedTileLayerSeedProgress } from "@yaga/leaflet-cached-tile-layer";
import { Map } from "leaflet";

document.addEventListener("DOMContentLoaded", () => {
    const map = new Map("map").setView([51.505, -0.09], 13);

    const leafletCachedTileLayer = new CachedTileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution: `&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors`,
        databaseName: "tile-cache-data", // optional
        databaseVersion: 1, // optional
        objectStoreName: "OSM", // optional
        crawlDelay: 500, // optional
        maxAge: 1000 * 60 * 60 * 24 * 7, // optional
    }).addTo(map);
    
    // The layer caches itself on tile load.
    // You can also seed explicit with:
    // - `leafletCachedTileLayer.seedCurrentView();`
    // - `leafletCachedTileLayer.seedBBox(/* ... */);`
    //
    // or clear the cache with:
    // - `leafletCachedTileLayer.clearCache();`
});
```

*There are more methods available, for further information take a look at the API documentation or the example...*

## NPM script tasks

* `npm test`: Runs the software tests with karma and leaves a coverage report under the folder `coverage`.
* `npm run travis-test`: Runs the software tests optimized for the [Travis-CI](https://travis-ci.org/).
* `npm run browser-test`: Prepares the tests to run directly in your browser. After running this command you have to
open `browser-test/index.html` in your browser of choice.
* `npm run doc`: Creates the API documentation with `typedoc` and places the documentation in the folder `typedoc`.

## Contribution

Make an issue on [GitHub](https://github.com/yagajs/leaflet-cached-tile-layer/), or even better a pull request and try
to fulfill the software tests.

## License

This library is under [ISC License](https://spdx.org/licenses/ISC.html) © by Arne Schubert and the YAGA Development
Team.