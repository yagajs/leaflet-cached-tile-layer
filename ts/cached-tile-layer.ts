import {
    IIndexedDbTileCacheSeedProgress as ICachedTileLayerSeedProgress,
    IndexedDbTileCache,
} from "@yaga/indexed-db-tile-cache";
import { DomEvent, LatLngBounds, Map, TileLayer, TileLayerOptions, Util } from "leaflet";

/**
 * Interface for the tile layer options. It is a mixin of the original Leaflet `TileLayerOptions` and the
 * `IndexedDbTileCacheOptions` of the YAGA Development Team.
 */
export interface ICachedTileLayerOptions extends TileLayerOptions {
    /**
     * Name of the database
     *
     * The default value is equal to the constance DEFAULT_DATABASE_NAME
     * @default "tile-cache-data"
     */
    databaseName?: string;
    /**
     * Version of the IndexedDB store. Should not be changed normally! But can provide an "upgradeneeded" event from
     * IndexedDB.
     *
     * The default value is equal to the constance DEFAULT_DATABASE_VERSION
     * @default 1
     */
    databaseVersion?: number;
    /**
     * Name of the object-store. Should correspond with the name of the tile server
     *
     * The default value is equal to the constance DEFAULT_OBJECT_STORE_NAME
     * @default "OSM";
     */
    objectStoreName?: string;
    /**
     * The delay in milliseconds used for not stressing the tile server while seeding.
     *
     * The default value is equal to the constance DEFAULT_CRAWL_DELAY
     * @default 500
     */
    crawlDelay?: number;
    /**
     * The maximum age in milliseconds of a stored tile.
     *
     * The default value is equal to the constance DEFAULT_MAX_AGE
     * @default 1000 * 60 * 60 * 24 * 7
     */
    maxAge?: number;
}

/**
 * Original Leaflet `TileLayer` enhanced with the `IndexedDbTileCache` of the YAGA Development Team.
 */
export class CachedTileLayer extends TileLayer {
    /**
     * Options of Leaflets `TileLayer`enhanced with the options for the `IndexedDbTileCache`.
     */
    public options: ICachedTileLayerOptions;
    constructor(urlTemplate: string, options?: ICachedTileLayerOptions) {
        super(urlTemplate, options);
    }

    /**
     * Rewritten method that serves the tiles from the `IndexedDbTileCache`
     */
    public createTile(coords, done): HTMLElement {
        // Rewrite of the original method...
        const tile = document.createElement("img");

        DomEvent.on(tile, "load", Util.bind((this as any)._tileOnLoad, this, done, tile));
        DomEvent.on(tile, "error", Util.bind((this as any)._tileOnError, this, done, tile));

        if (this.options.crossOrigin) {
            tile.crossOrigin = "";
        }

        /*
         Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
         http://www.w3.org/TR/WCAG20-TECHS/H67
         */
        tile.alt = "";

        /*
         Set role="presentation" to force screen readers to ignore this
         https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
         */
        tile.setAttribute("role", "presentation");

        const tc: IndexedDbTileCache = this.instantiateIndexedDbTileCache();
        tc.getTileAsDataUrl({
            x: coords.x,
            y: coords.y,
            z: (this as any)._getZoomForUrl(),
        }).then((dataUrl: string) => {
            tile.src = dataUrl;
        }).catch(() => {
            tile.src =  this.options.errorTileUrl;
        });

        return tile;
    }

    /**
     * Method that creates an instance of the `IndexedDbTileCache` from the options of this object.
     *
     * You can use this method to make advances operations on the tile cache.
     */
    public instantiateIndexedDbTileCache(): IndexedDbTileCache {
        return new IndexedDbTileCache({
            crawlDelay: this.options.crawlDelay,
            databaseName: this.options.databaseName,
            databaseVersion: this.options.databaseVersion,
            maxAge: this.options.maxAge,
            objectStoreName: this.options.objectStoreName,
            tileUrl: (this as any)._url,
            tileUrlSubDomains: this.options.subdomains as string[],
        });
    }

    /**
     * Seed an area with a Leaflet `LatLngBound` and the given zoom range.
     *
     * The callback will be called before starting to download a tile and once after it is finished.
     *
     * The default value for `maxZoom` is the current zoom level of the map and the default value for `minZoom` is
     * always `0`.
     */
    public seedBBox(
        bbox: LatLngBounds,
        maxZoom?: number,
        minZoom: number = 0,
        cb?: (progress: ICachedTileLayerSeedProgress) => void,
    ): Promise<number> {
        if (maxZoom === undefined) {
            maxZoom = ((this as any)._map as Map).getZoom();
        }
        const tc: IndexedDbTileCache = this.instantiateIndexedDbTileCache();
        if (cb) {
            tc.on("seed-progress", cb);
        }
        return tc.seedBBox({
            maxLat: bbox.getNorth(),
            maxLng: bbox.getEast(),
            minLat: bbox.getSouth(),
            minLng: bbox.getWest(),
        }, maxZoom, minZoom);
    }

    /**
     * Seeds like `this.seedBBox`, but uses the current map bounds as bounding box.
     */
    public seedCurrentView(
        maxZoom?: number,
        minZoom: number = 0,
        cb?: (progress: ICachedTileLayerSeedProgress) => void,
    ): Promise<number> {
        return this.seedBBox(((this as any)._map as Map).getBounds(), maxZoom, minZoom, cb);
    }

    /**
     * Clears the whole cache.
     */
    public clearCache(): Promise<boolean> {
        const tc: IndexedDbTileCache = this.instantiateIndexedDbTileCache();
        return tc.purgeStore();
    }
}
