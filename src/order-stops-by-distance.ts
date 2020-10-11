import { Stop } from "./stop";
import { haversine } from "./haversine";

export function orderStopsByDistance(stops: Stop[], lat:number, lng:number) {
    return stops
        .map(v => {
            return {
                stop: v,
                d: haversine([v.stop_lat, v.stop_lon], [lat, lng])
            }
        })
        .sort((a, b) => a.d - b.d)
        .map(v => v.stop);
}