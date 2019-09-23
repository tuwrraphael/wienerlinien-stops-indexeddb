import { StopStore } from "../dist/index.js";
var store = new StopStore("test");
store.maintainDb().then(() => {
    window.navigator.geolocation.getCurrentPosition(function (r) {
        store.query(r.coords.latitude, r.coords.longitude,  500).then(res => {
            let results = document.querySelector("#results");
            res.forEach(stop => {
                let el = document.createElement("li");
                el.innerText = `${stop.stop_name} bei ${stop.stop_lat}, ${stop.stop_lon}`;
                results.appendChild(el);
            });
        });
    });
})