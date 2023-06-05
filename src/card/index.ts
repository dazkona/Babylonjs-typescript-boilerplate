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

import { CreateRoundBoxPayload, CardTextPayload } from "./types";

export default class Card 
{
	m_baseCard = null;

	//-----------------------------------------------------
	constructor() 
	{
	}

	//-----------------------------------------------------
	protected createRoundedBox(scene: Scene, payload: CreateRoundBoxPayload): Mesh
	{
		const THICKNESS = payload.thickness;
		const ROUND_CORNER_RADIUS = payload.roundCornerRadius;
		const RC_DIAMETER = ROUND_CORNER_RADIUS * 2;
		const CARD_WIDTH = payload.width;
		const CARD_HEIGHT = payload.height;
		const W_CENTER2CENTER = CARD_WIDTH - ROUND_CORNER_RADIUS - ROUND_CORNER_RADIUS;
		const halfWC2C = W_CENTER2CENTER / 2;
		const H_CENTER2CENTER = CARD_HEIGHT - ROUND_CORNER_RADIUS - ROUND_CORNER_RADIUS;
		const halfHC2C = H_CENTER2CENTER / 2;
	
		const tlRoundCorner = MeshBuilder.CreateCylinder("tlRndCorner", {height: THICKNESS, diameter: RC_DIAMETER}, scene);
		tlRoundCorner.position.x -= halfWC2C;
		tlRoundCorner.position.z += halfHC2C;	
		const tRRoundCorner = MeshBuilder.CreateCylinder("tRRndCorner", {height: THICKNESS, diameter: RC_DIAMETER}, scene);
		tRRoundCorner.position.x += halfWC2C;
		tRRoundCorner.position.z += halfHC2C;	
		const blRoundCorner = MeshBuilder.CreateCylinder("blRndCorner", {height: THICKNESS, diameter: RC_DIAMETER}, scene);
		blRoundCorner.position.x -= halfWC2C;
		blRoundCorner.position.z -= halfHC2C;	
		const bRRoundCorner = MeshBuilder.CreateCylinder("bRRndCorner", {height: THICKNESS, diameter: RC_DIAMETER}, scene);
		bRRoundCorner.position.x += halfWC2C;
		bRRoundCorner.position.z -= halfHC2C;	
	
		const topBase = MeshBuilder.CreateBox("tbase", {width: W_CENTER2CENTER, height: THICKNESS, depth: RC_DIAMETER}, scene);
		topBase.position.z += halfHC2C;
		const bottomBase = MeshBuilder.CreateBox("bbase", {width: W_CENTER2CENTER, height: THICKNESS, depth: RC_DIAMETER}, scene);
		bottomBase.position.z -= halfHC2C;
		const leftBase = MeshBuilder.CreateBox("lbase", {width: RC_DIAMETER, height: THICKNESS, depth: H_CENTER2CENTER}, scene);
		leftBase.position.x -= halfWC2C;	
		const rightBase = MeshBuilder.CreateBox("rbase", {width: RC_DIAMETER, height: THICKNESS, depth: H_CENTER2CENTER}, scene);
		rightBase.position.x += halfWC2C;
		const centerBase = MeshBuilder.CreateBox("cbase", {width: W_CENTER2CENTER + ROUND_CORNER_RADIUS, height: THICKNESS, depth: H_CENTER2CENTER + ROUND_CORNER_RADIUS}, scene);
	
		const toMerge = [centerBase,
			topBase, bottomBase, leftBase, rightBase, 
			tlRoundCorner, tRRoundCorner, blRoundCorner, bRRoundCorner];
	
		let cardCSG = CSG.FromMesh(toMerge[0]);
		toMerge[0].dispose();
		for(let i = 1; i < toMerge.length; i++)
		{
			const newCSG = CSG.FromMesh(toMerge[i]);
			cardCSG = cardCSG.union(newCSG);
			toMerge[i].dispose();
		}
		return cardCSG.toMesh("roundedBox");
	}	

	//-----------------------------------------------------
	protected createCardTextMaterial(scene: Scene, textPayload: CardTextPayload): StandardMaterial
	{
		const TITLE_FSIZE = 48;
		const SUBSTITLE_FSIZE = 18;
		const ID_FSIZE = 32;
		const BORDERLABEL_FSIZE = 18;
		const TEX_WIDTH = 600;
		const TEX_HEIGHT = 900;
	
		const dynamicTexture = new DynamicTexture("dynamicTexture", {width: TEX_WIDTH, height: TEX_HEIGHT}, scene, false);
		dynamicTexture.hasAlpha = true;
	
		const baseMaterial = new StandardMaterial("baseMaterial", scene);
		baseMaterial.specularColor = new Color3(0, 0, 0);
		baseMaterial.emissiveColor = new Color3(0, 0, 0);
		baseMaterial.diffuseTexture = dynamicTexture;
	
		const ctx = dynamicTexture.getContext();
		ctx.font = `bold ${TITLE_FSIZE}px Verdana`;
		let textWidth = ctx.measureText(textPayload.title).width;
		let ratio = (textWidth / TITLE_FSIZE) * 1.5;
		const TITLE_SIZE = Math.floor(TEX_WIDTH / (ratio * 1.5));
		dynamicTexture.drawText(textPayload.title, 50, 625, `bold ${TITLE_SIZE}px Verdana`, "#000000", "transparent", true);
	
		const SUBTITLE_SIZE = (SUBSTITLE_FSIZE / TITLE_FSIZE) * TITLE_SIZE;
		for(let s = 0; s < textPayload.subtitle.length; s++)
			dynamicTexture.drawText(textPayload.subtitle[s], 50, 690 + (50 * s), `bold ${SUBTITLE_SIZE}px Verdana`, "#666666", "transparent", true);
	
		const BORDER_SIZE = (BORDERLABEL_FSIZE / TITLE_FSIZE) * TITLE_SIZE;
		dynamicTexture.drawText(textPayload.borderLabel, 50, 40, `${BORDER_SIZE}px Verdana`, "#000000", "transparent", true);
	
		const ID_SIZE = (ID_FSIZE / TITLE_FSIZE) * TITLE_SIZE;
		dynamicTexture.drawText("#" + textPayload.id, (TEX_WIDTH / 2), 50, `${ID_SIZE}px Verdana`, "#555555", "transparent", true);
	
		return baseMaterial;
	}	

	//-----------------------------------------------------
	protected createCard(scene: Scene, textPayload: CardTextPayload)
	{
		const firstBaseCard = this.createRoundedBox(scene, {
			thickness: 0.0333,
			roundCornerRadius: 0.5,
			width: 6,
			height: 9
		});
		const baseCardCSG = CSG.FromMesh(firstBaseCard);
		firstBaseCard.dispose();
	
		const hole = this.createRoundedBox(scene, {
			thickness: 1,
			roundCornerRadius: 0.25,
			width: 5,
			height: 5
		});
		hole.position.z += ((9 - 5) / 2) - 0.5;
		hole.position.y += 0.3;
		const holeCSG = CSG.FromMesh(hole);
		hole.dispose();
	
		const cardCSG = baseCardCSG.subtract(holeCSG);
	
		const cardTextMaterial = this.createCardTextMaterial(scene, textPayload);
		var textPlane1 = MeshBuilder.CreatePlane("cardTextPlane1", {
			width: 6,
			height: 9
		});
		textPlane1.addRotation(Math.PI/2,0,0);
		textPlane1.position.y += 0.35;
		textPlane1.material = cardTextMaterial;
	
		const baseMaterial = new StandardMaterial("baseMaterial", scene);
		baseMaterial.diffuseColor = new Color3(1, 1, 1);
		baseMaterial.alpha = 0.6;
		const card = cardCSG.toMesh("baseCard", baseMaterial, scene);
	
		const backCard = card.clone("back card", card);
		const backMaterial = new StandardMaterial("backMaterial", scene);
		backMaterial.diffuseColor = new Color3(1, 1, 1);
		backCard.material = backMaterial;
		backCard.position.y -= 0.5;
	
		textPlane1.setParent(card);
	
		return card;
	}	

	//-----------------------------------------------------
	protected animateCard(scene: Scene)
	{
		const frameRate = 10;
	
		const zRotation = new Animation("zRotation", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
		
		const keyFrames = []; 
		
		keyFrames.push({
			frame: 0,
			value: this.m_baseCard.rotation.z
		});
		
		keyFrames.push({
			frame: frameRate * 5,
			value: this.m_baseCard.rotation.z + (Math.PI / 3)
		});
		
		keyFrames.push({
			frame: frameRate * 10,
			value: this.m_baseCard.rotation.z
		});
		
		keyFrames.push({
			frame: frameRate * 15,
			value: this.m_baseCard.rotation.z - (Math.PI / 3)
		});
		
		keyFrames.push({
			frame: frameRate * 20,
			value: this.m_baseCard.rotation.z
		});
		
		zRotation.setKeys(keyFrames);
		
		this.m_baseCard.animations.push(zRotation);
		
		scene.beginAnimation(this.m_baseCard, 0, 20 * frameRate, true);
	}

	//-----------------------------------------------------
	protected loadCharacter(scene: Scene)
	{
		SceneLoader.ImportMesh("", "https://assets.babylonjs.com/meshes/", "HVGirl.glb",
			scene, (newMeshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights) => {
				const redGirl = newMeshes[0];
		
				//Scale the model down
				redGirl.scaling.scaleInPlace(0.2);
				redGirl.position.y -= 1.0;
				redGirl.position.z -= 2.0;
		
				const blueGirl = redGirl.clone("blueGirl", scene.rootNodes[0]);
		
				const baseMaterial = new StandardMaterial("baseMaterial", scene);
				baseMaterial.diffuseColor = new Color3(1, 0, 0);
				baseMaterial.alpha = 0.2;
		
				const baseMaterial2 = new StandardMaterial("baseMaterial2", scene);
				baseMaterial2.diffuseColor = new Color3(0, 0, 1);
				baseMaterial2.alpha = 0.2;		
		
				for(let g = 0; g <= 10; g++)
				{
					const girlMesh = scene.getMeshByName("HVGirl_primitive"+g);
					girlMesh.material = baseMaterial;
		
					const girlMesh2 = scene.getMeshByName("blueGirl.Idle.HVGirl.HVGirl_primitive"+g);
					girlMesh2.material = baseMaterial2;			
				}
		
				//Get the Samba animation Group
				const sambaAnim = scene.getAnimationGroupByName("Samba");
		
				//Play the Samba animation
				sambaAnim.start(true, 1.0, sambaAnim.from, sambaAnim.to, false);
		
				redGirl.setParent(this.m_baseCard);
			}
		);		
	}
	
	//-----------------------------------------------------
	create(scene: Scene)
	{
		this.m_baseCard = this.createCard(scene, {
			title: "My title",
			subtitle: [
				"My subtitle could be a way too long.", 
				"It's an explanation or a list.",
				"Whatever you need"
			],
			id: "12345678",
			borderLabel: "My name"
		});
		this.m_baseCard.rotation.x -= Math.PI / 2;
		this.m_baseCard.rotation.y = Math.PI;

		this.loadCharacter(scene);

		this.animateCard(scene);
	}
};