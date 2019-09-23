const MAX_LAT = Math.PI / 2;
const MIN_LAT = -MAX_LAT;
const MAX_LON = Math.PI; 
const MIN_LON = -MAX_LON;
const FULL_CIRCLE_RAD = Math.PI * 2;

const toRad = x => x * (Math.PI / 180);
const toDeg = x => x / (Math.PI / 180);

export function boundingCoordinates(lat, lon, distance) {
    lat = toRad(lat);
    lon = toRad(lon);
    let radDist = distance / 6371.01,
        minLat = lat - radDist,
        maxLat = lat + radDist,
        minLon,
        maxLon,
        deltaLon;
    if (minLat > MIN_LAT && maxLat < MAX_LAT) {
        deltaLon = Math.asin(Math.sin(radDist) / Math.cos(lat));
        minLon = lon - deltaLon;
        if (minLon < MIN_LON) {
            minLon += FULL_CIRCLE_RAD;
        }
        maxLon = lon + deltaLon;
        if (maxLon > MAX_LON) {
            maxLon -= FULL_CIRCLE_RAD;
        }
    } else {
        minLat = Math.max(minLat, MIN_LAT);
        maxLat = Math.min(maxLat, MAX_LAT);
        minLon = MIN_LON;
        maxLon = MAX_LON;
    }
    return [toDeg(minLat), toDeg(minLon), toDeg(maxLat), toDeg(maxLon)];
};