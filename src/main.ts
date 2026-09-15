import "./styles/reset.css";
import "./styles/main.css";
import van from "vanjs-core";
import { World } from "./core/World";
import { $world } from "./stores";
import { Footer } from "./ui/Footer";
import { Header } from "./ui/Header";
import { MobileBlocker } from "./ui/MobileBlocker";
import { Tooltip } from "./ui/Tooltip";
import { WorldCanvas } from "./ui/WorldCanvas";

van.add(document.body, WorldCanvas(), Header(), Footer(), Tooltip(), MobileBlocker());
$world.set(new World());
