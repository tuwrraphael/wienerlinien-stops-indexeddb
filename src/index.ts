import { processStream } from "./process-stream";
import { boundingCoordinates } from "./bounding-coordinates";

const STATION_URL = "https://www.data.wien.gv.at/txt/wrlinien-gtfs-stops.txt";
const WEEK = 7 * 24 * 60 * 60 * 1000;

export class StopStore {

    constructor(private dbName: string) {
    }

    async import(saveStops) {
        let res = await fetch(STATION_URL);
        const bodyAsTextStream = res.body.pipeThrough(new TextDecoderStream());
        await processStream(bodyAsTextStream, saveStops);
    }

    query(lat, lng, r) {
        const [minLat, minLon, maxLat, maxLon] = boundingCoordinates(lat, lng, r / 1000);
        return new Promise((resolve, reject) => {
            let lat_range = IDBKeyRange.bound(minLat, maxLat);
            let long_range = IDBKeyRange.bound(minLon, maxLon);
            this.openDb().then(db => {
                let tx = db.transaction("Stops");
                let obj_store = tx.objectStore("Stops");
                let res = [];
                let results = [];
                let lat_request = obj_store.index('stop_lat').getAllKeys(lat_range);
                let lng_request = obj_store.index('stop_lon').getAllKeys(long_range);
                function provideResults() {
                    let tx = db.transaction("Stops");
                    let obj_store = tx.objectStore("Stops");
                    let objs = [];
                    results.forEach(v => {
                        let request = obj_store.get(v);
                        request.onsuccess = () => {
                            objs.push(request.result);
                            if (objs.length == results.length) {
                                resolve(objs);
                            }
                        };
                        request.onerror = err => reject(err);
                    });
                }
                lat_request.onsuccess = () => {
                    if (res.length) {
                        results = lat_request.result.filter(s => res.indexOf(s) > -1);
                        provideResults();
                    }
                    res = lat_request.result;
                }
                lat_request.onerror = err => reject(err);
                lng_request.onsuccess = () => {
                    if (res.length) {
                        results = lng_request.result.filter(s => res.indexOf(s) > -1);
                        provideResults();
                    }
                    res = lng_request.result;
                }
                lng_request.onerror = err => reject(err);
            }, err => reject(err));
        });
    }


    openDb(): Promise<IDBDatabase> {
        let self = this;
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.open(self.dbName, 2);
            request.onsuccess = function () {
                resolve(request.result);
            }
            request.onupgradeneeded = function (ev) {
                if (ev.oldVersion < 2) {
                    let stopStore = request.result.createObjectStore("Stops", { keyPath: "stop_id" });
                    stopStore.createIndex("stop_lat", "stop_lat", { unique: false });
                    stopStore.createIndex("stop_lon", "stop_lon", { unique: false });
                    stopStore.createIndex('version', ['version'], { unique: false });
                    request.result.createObjectStore("Logs", { keyPath: "id" });
                }
            }
            request.onerror = function (err) {
                reject(err);
            }
        });
    }

    getLogEntry(): Promise<{ version: number, updated: number }> {
        return new Promise((resolve, reject) => {
            this.openDb().then(db => {
                let tx = db.transaction("Logs");
                let logsStore = tx.objectStore("Logs");
                let request = logsStore.get(0);
                request.onsuccess = () => resolve(<{ version: number, updated: number }>request.result || { version: 0, updated: 0 });
                request.onerror = err => reject(err);
            }, err => reject(err));
        });
    }

    async maintainDb() {
        let db = await this.openDb();
        let logEntry = await this.getLogEntry();
        if (+new Date() - logEntry.updated < WEEK) {
            return;
        }
        logEntry.version++;
        await this.import(function (stops) {
            let tx = db.transaction("Stops", "readwrite");
            let stopStore = tx.objectStore("Stops");
            for (let stop of stops) {
                stopStore.put({ ...stop, version: logEntry.version });
            }
        });
        let tx = db.transaction("Stops", "readwrite");
        let stopStore = tx.objectStore("Stops");
        var pdestroy = stopStore.index("version").openKeyCursor(IDBKeyRange.only(logEntry.version - 1));
        pdestroy.onsuccess = function () {
            var cursor = pdestroy.result;
            if (cursor) {
                stopStore.delete(cursor.primaryKey);
                cursor.continue;
            }
        }
        tx = db.transaction("Logs", "readwrite");
        let logStore = tx.objectStore("Logs");
        logStore.put({ id: 0, updated: +new Date(), version: logEntry.version });
    }
}