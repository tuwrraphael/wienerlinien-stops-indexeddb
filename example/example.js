import { StopStore, orderStopsByDistance } from "../dist/index.js";
var store = new StopStore("test");

function writeResults(res, target) {
    let results = document.querySelector(target);
    res.forEach(stop => {
        let el = document.createElement("li");
        el.innerText = `${stop.stop_name} bei ${stop.stop_lat}, ${stop.stop_lon}`;
        results.appendChild(el);
    });
}

store.maintainDb().then(() => {
    window.navigator.geolocation.getCurrentPosition(function (r) {
        store.query(r.coords.latitude, r.coords.longitude, 500).then(res => {
            res = orderStopsByDistance(res, r.coords.latitude, r.coords.longitude);
            writeResults(res, "#nearest");
        });
        store.queryByName("Stadthalle")
            .then(d => writeResults(d, "#search"));
    });
})