import { Map } from "./Map.js";
import { Crosshair } from "./Crosshair.js";
import { World } from "./World.js";

const world = new World();
const map = new Map(world.scene);
world.startRendering();