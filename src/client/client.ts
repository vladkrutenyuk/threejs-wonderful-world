import { Map } from "./Map.js";
import { World } from "./World.js";
import { MapCursor } from "./MapCursor.js";
import { Input } from "./Input.js";

const world = new World();
const map = new Map(world.scene);
const mapCursor = new MapCursor(world.scene, world.camera, map.mesh);
const input = new Input();

const update = () => {
    requestAnimationFrame(update);
    mapCursor.positioning(input.mousePosition);
}

world.startRendering();
update();