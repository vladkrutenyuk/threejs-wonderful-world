import { Map } from "./Map.js";
import { World } from "./World.js";
import { MapCursor } from "./MapCursor.js";
import { Input } from "./Input.js";

const world = new World();
const map = new Map(world.scene);
map.initMarkers("data/markers.json");
const mapCursor = new MapCursor(world.scene, world.camera, map.mesh, map.markersGroup);
const input = new Input();

const update = (): void => {
    requestAnimationFrame(update);
    mapCursor.positioning(input.mousePosition);
    world.render();
}

update();

