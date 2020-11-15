import { Map } from "./Map.js";
import { World } from "./World.js";
import { MapCursor } from "./MapCursor.js";
import { Input } from "./Input.js";

const jsonDataUrl: string = "data/markers.json";

const world = new World();

const map = new Map(world.scene);
const initMarkers = map.initMarkers(jsonDataUrl);

const mapCursor = new MapCursor(world.scene, world.camera, map.mesh, map.markersGroup);
const input = new Input();
input.setMouseMoveEventListener(mapCursor.positioning);

const update = (): void => {
    requestAnimationFrame(update);
    mapCursor.update(input.mousePosition);
    world.render();
}

update();

