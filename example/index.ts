import { Map } from "leaflet";
import { marker } from "leaflet";
import { CachedTileLayer, ICachedTileLayerSeedProgress } from "../lib";

document.addEventListener("DOMContentLoaded", () => {
    (window as any).map = new Map("map").setView([51.505, -0.09], 13);

    (window as any).leafletCachedTileLayer = new CachedTileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution: `&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors`,
    }).addTo((window as any).map);

    marker([51.5, -0.09]).addTo((window as any).map)
        .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
        .openPopup();

    const seedButton = document.createElement("button");
    seedButton.setAttribute("class", "btn btn-primary");
    seedButton.appendChild(document.createTextNode("Seed current view"));
    seedButton.addEventListener("click", () => {
        const progressDiv = document.createElement("div");
        progressDiv.setAttribute("class", "progress");

        const progressBarDiv = document.createElement("div");
        progressBarDiv.setAttribute("class", "progress-bar progress-bar-success");
        progressBarDiv.setAttribute("style", "width: 0%;");
        progressDiv.appendChild(progressBarDiv);
        document.getElementById("progress-wrapper").appendChild(progressDiv);

        (window as any).leafletCachedTileLayer.seedCurrentView(
            undefined,
            undefined,
            (progress: ICachedTileLayerSeedProgress) => {
                const percentage = Math.ceil(((progress.total - progress.remains) / progress.total) * 100);
                progressBarDiv.setAttribute("style", `width: ${ percentage }%;`);
                if (progress.remains === 0) {
                    progressBarDiv.appendChild(document.createTextNode("Done..."));
                    setTimeout(() => {
                        progressDiv.parentNode.removeChild(progressDiv);
                    }, 3000);
                }
            },
        );
    });

    const purgeButton = document.createElement("button");
    purgeButton.setAttribute("class", "btn btn-danger");
    purgeButton.appendChild(document.createTextNode("Purge cache"));
    purgeButton.addEventListener("click", () => {
        (window as any).leafletCachedTileLayer.clearCache();
    });

    document.getElementById("button-wrapper").appendChild(seedButton);
    document.getElementById("button-wrapper").appendChild(purgeButton);
});
