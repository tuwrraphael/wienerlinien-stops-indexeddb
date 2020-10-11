import { splitCsvLine } from "./split-csv-line";

export function processStream(bodyAsTextStream: ReadableStream, saveStops: (stops: {
    stop_id: string,
    stop_name: string,
    stop_lat: number,
    stop_lon: number
}[]) => void) {
    return new Promise((resolve, reject) => {
        let accumulate = "";
        let header = false;
        let map = { stop_id: 0, stop_name: 0, stop_lat: 0, stop_lon: 0 };
        let numProps = Object.keys(map).length;
        const appendStream = new WritableStream({
            write(chunk) {
                let stops: {
                    stop_id: string,
                    stop_name: string,
                    stop_lat: number,
                    stop_lon: number
                }[] = [];
                accumulate += chunk;
                let incomplete = false;
                let splitted = accumulate.replace(/\r/g, "").split("\n");
                splitted.map(stopString => {
                    let stopSplitted = Array.from(splitCsvLine(stopString, ","));
                    if (!header || accumulate.length < 2) {
                        for (let prop in map) {
                            if (map.hasOwnProperty(prop)) {
                                map[<keyof (typeof map)>prop] = stopSplitted.indexOf(prop);
                            }
                        }
                        header = true;
                    }
                    if (header && stopSplitted.length >= numProps) {
                        stops.push({
                            stop_id: stopSplitted[map.stop_id],
                            stop_name: stopSplitted[map.stop_name],
                            stop_lat: parseFloat(stopSplitted[map.stop_lat]),
                            stop_lon: parseFloat(stopSplitted[map.stop_lon])
                        });
                    } else {
                        incomplete = true;
                    }
                });
                if (incomplete) {
                    accumulate = splitted[splitted.length - 1];
                }
                else {
                    accumulate = "";
                }
                if (stops.length) {
                    saveStops(stops);
                }
            },
            close: function () {
                resolve();
            },
            abort: function () {
                reject();
            }
        });
        bodyAsTextStream.pipeTo(appendStream);
    });
}