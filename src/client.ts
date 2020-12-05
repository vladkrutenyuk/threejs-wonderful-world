import { Map } from "./Map";
import { World } from "./World";
import { MapCursor } from "./MapCursor";
import { Input } from "./Input";
import { UIManager } from "./UIManager";
import TWEEN from "@tweenjs/tween.js";

const jsonDataUrl: string = "data/markers.json";

const world = new World();

const map = new Map(world.scene);
const initMarkers = map.initMarkers(jsonDataUrl);
initMarkers.then(() => console.log("Markers initing was finished!"));

const mapCursor = new MapCursor(world.scene, world.camera, map);
const input = new Input();
input.setMouseMoveEventListener(mapCursor.positioning);
input.setMouseClickEventListener(mapCursor.setOveredMarkerSelection);

const mainUpdate = (): void => {
    requestAnimationFrame(mainUpdate);
    TWEEN.update();
    mapCursor.update();
    world.render();
    UIManager.update();
}

mainUpdate();

