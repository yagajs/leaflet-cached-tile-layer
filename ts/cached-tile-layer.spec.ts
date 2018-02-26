import { IndexedDbTileCache } from "@yaga/indexed-db-tile-cache";
import { IBBox } from "@yaga/tile-utils";
import { expect } from "chai";
import { LatLngBounds } from "leaflet";
import { CachedTileLayer, ICachedTileLayerOptions } from "./index";

const TEST_URL_TEMPLATE: string = "http://{s}.example.com/{z}/{x}/{y}.png";
const TRANSPARENT_PIXEL: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42m" +
    "NkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/* tslint:disable:no-empty */
/* istanbul ignore next */
function noop() {}
/* tslint:enable */

describe("CachedTileLayer", () => {
    describe(".createTile", () => {
        it("should return an HTML image tag", () => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    getTileAsDataUrl: () => Promise.resolve(TRANSPARENT_PIXEL),
                };
            };
            expect(cachedTileLayer.createTile({x: 1, y: 2}, noop)).to.be.an.instanceOf(HTMLElement);
        });
        it("should change the source of the HTML image tag", (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    getTileAsDataUrl: () => {
                        return Promise.resolve(TRANSPARENT_PIXEL);
                    },
                };
            };
            const createdTile: HTMLImageElement = cachedTileLayer.createTile({x: 1, y: 2}, noop) as HTMLImageElement;
            setTimeout(() => {
                expect(createdTile.src).to.equal(TRANSPARENT_PIXEL);
                done();
            }, 10);

        });
        it("should give an error tile", (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE, {
                errorTileUrl: TRANSPARENT_PIXEL,
            });
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    getTileAsDataUrl: () => {
                        return Promise.reject(new Error("No further reason... Just for testing..."));
                    },
                };
            };
            const createdTile: HTMLImageElement = cachedTileLayer.createTile({x: 1, y: 2}, noop) as HTMLImageElement;
            setTimeout(() => {
                expect(createdTile.src).to.equal(TRANSPARENT_PIXEL);
                done();
            }, 10);

        });
        it("should support the cross-origin event if there is no need for", () => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE, {
                crossOrigin: true,
            });
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    getTileAsDataUrl: () => Promise.resolve(TRANSPARENT_PIXEL),
                };
            };
            expect((cachedTileLayer.createTile({x: 1, y: 2}, noop) as HTMLImageElement).crossOrigin)
                .to.equal("anonymous");
        });

    });
    describe(".instantiateIndexedDbTileCache", () => {
        it("should have the right url template even when calling without options", () => {
            const tileCacheApi: IndexedDbTileCache = new CachedTileLayer(TEST_URL_TEMPLATE)
                .instantiateIndexedDbTileCache();
            expect(tileCacheApi).to.be.an.instanceOf(IndexedDbTileCache);
            expect(tileCacheApi.options.tileUrl).to.equal(TEST_URL_TEMPLATE);
        });
        it("should return an instance of IndexedDbTileCache with specific options", () => {
            const layerOptions: ICachedTileLayerOptions = {
                crawlDelay: 1234,
                databaseName: "test-db",
                databaseVersion: 1,
                errorTileUrl: "error.tile",
                maxAge: 54321,
                objectStoreName: "test-os",
                subdomains: ["z", "x", "y"],
            };
            const tileCacheApi: IndexedDbTileCache = new CachedTileLayer(TEST_URL_TEMPLATE, layerOptions)
                .instantiateIndexedDbTileCache();
            expect(tileCacheApi).to.be.an.instanceOf(IndexedDbTileCache);
            expect(tileCacheApi.options.databaseName).to.equal(layerOptions.databaseName);
            expect(tileCacheApi.options.databaseVersion).to.equal(layerOptions.databaseVersion);
            expect(tileCacheApi.options.objectStoreName).to.equal(layerOptions.objectStoreName);
            expect(tileCacheApi.options.tileUrl).to.equal(TEST_URL_TEMPLATE);
            expect(tileCacheApi.options.tileUrlSubDomains).to.equal(layerOptions.subdomains);
            expect(tileCacheApi.options.crawlDelay).to.equal(layerOptions.crawlDelay);
            expect(tileCacheApi.options.maxAge).to.equal(layerOptions.maxAge);
        });
    });
    describe(".seedBBox", () => {
        it("should call the seedBBox of the IndexedDbTileCache instance", (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            const testBBox: IBBox = {
                maxLat: 1,
                maxLng: 1,
                minLat: -1,
                minLng: -1,
            };
            const testLeafletBounds: LatLngBounds = new LatLngBounds([-1, -1], [1, 1]);
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    seedBBox: (bbox: IBBox, maxZ: number, minZ: number) => {
                        expect(bbox).to.deep.equal(testBBox);
                        expect(maxZ).to.equal(20);
                        expect(minZ).to.equal(10);
                        done();
                    },
                };
            };
            cachedTileLayer.seedBBox(testLeafletBounds, 20, 10);
        });
        it("should call the seedBBox of the IndexedDbTileCache instance with current zoom", (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            const testBBox: IBBox = {
                maxLat: 1,
                maxLng: 1,
                minLat: -1,
                minLng: -1,
            };
            const testLeafletBounds: LatLngBounds = new LatLngBounds([-1, -1], [1, 1]);

            (cachedTileLayer as any)._map = {
                getZoom: () => 11,
            };

            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    seedBBox: (bbox: IBBox, maxZ: number, minZ: number) => {
                        expect(bbox).to.deep.equal(testBBox);
                        expect(maxZ).to.equal(11);
                        expect(minZ).to.equal(0);
                        done();
                    },
                };
            };
            cachedTileLayer.seedBBox(testLeafletBounds);
        });
        it("should call the callback when event emitter fires", (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            const testLeafletBounds: LatLngBounds = new LatLngBounds([-1, -1], [1, 1]);

            (cachedTileLayer as any)._map = {
                getZoom: () => 11,
            };

            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    on: (name: string, cb: () => void) => {
                        expect(name).to.equal("seed-progress");
                        expect(cb).to.equal(noop);
                        done();
                    },
                    seedBBox: noop,
                };
            };
            cachedTileLayer.seedBBox(testLeafletBounds, undefined, undefined, noop);
        });
    });
    describe(".seedCurrentView", () => {
        it("should call the seedBBox of the IndexedDbTileCache instance with the current bounding box", (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            (cachedTileLayer as any)._map = {
                getBounds: () => (new LatLngBounds([1, 2], [4, 3])),
            };
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    seedBBox: (bbox: IBBox, maxZ: number, minZ: number) => {
                        expect(bbox.maxLat).to.equal(4);
                        expect(bbox.maxLng).to.equal(3);
                        expect(bbox.minLat).to.equal(1);
                        expect(bbox.minLng).to.equal(2);
                        expect(maxZ).to.equal(20);
                        expect(minZ).to.equal(10);
                        done();
                    },
                };
            };
            cachedTileLayer.seedCurrentView(20, 10);
        });
        it(
            "should call the seedBBox of the IndexedDbTileCache instance with the current bounding box and zoom level",
            (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            (cachedTileLayer as any)._map = {
                getBounds: () => (new LatLngBounds([1, 2], [4, 3])),
                getZoom: () => 11,
            };
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    seedBBox: (bbox: IBBox, maxZ: number, minZ: number) => {
                        expect(bbox.maxLat).to.equal(4);
                        expect(bbox.maxLng).to.equal(3);
                        expect(bbox.minLat).to.equal(1);
                        expect(bbox.minLng).to.equal(2);
                        expect(maxZ).to.equal(11);
                        expect(minZ).to.equal(0);
                        done();
                    },
                };
            };
            cachedTileLayer.seedCurrentView();
        },
        );
    });
    describe(".clearCache", () => {
        it("should call the purgeStore of the IndexedDbTileCache instance", (done) => {
            const cachedTileLayer = new CachedTileLayer(TEST_URL_TEMPLATE);
            cachedTileLayer.instantiateIndexedDbTileCache = () => {
                return {
                    purgeStore: () => {
                        done();
                    },
                };
            };
            cachedTileLayer.clearCache();
        });
    });
});
