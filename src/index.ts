import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4, Mesh, CSG, GlowLayer, Animation } from "@babylonjs/core";
import { Material, StandardMaterial, PBRMaterial, DynamicTexture } from "@babylonjs/core/Materials";
import { ActionManager, ExecuteCodeAction } from "@babylonjs/core/Actions";
import { SceneLoader } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Inspector } from "@babylonjs/inspector";

import Card from "./card";

const renderCanvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(renderCanvas, true);

const scene = new Scene(engine);
scene.clearColor = new Color4(0.2, 0.2, 0.2, 1);
scene.createDefaultEnvironment();

const alpha =  Math.PI/2;
const beta = Math.PI/2;
const radius = 16;
const target = new Vector3(0, 0, 0);

const camera = new ArcRotateCamera("Camera", alpha, beta, radius, target, scene);
camera.attachControl(renderCanvas, true);

const light = new HemisphericLight("light", new Vector3(0, 10, 10), scene);

const card = new Card();
card.create(scene);

/*Inspector.Show(scene, {});*/

/*scene.registerBeforeRender(function () {
	const msDT = scene.deltaTime / 1000; 
	baseCard.addRotation(0, 0, 0.25 * msDT);
});*/

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", function () {
	engine.resize();
});