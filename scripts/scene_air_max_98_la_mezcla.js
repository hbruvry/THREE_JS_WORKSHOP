/*
** Dependencies of this three.js scene
*/

import * as THREE from 'https://unpkg.com/three@0.121.1/build/three.module.js';
import Stats from 'https://unpkg.com/three@0.121.1/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.121.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.121.1/examples/jsm/loaders/FBXLoader.js';
import { EXRLoader } from 'https://unpkg.com/three@0.121.1/examples/jsm/loaders/EXRLoader.js';

/*
** Global variables
*/

var stats, container, renderer, scene, camera, controls;
var model;
const path = 'textures/';
const res = '1k';
const shadowRes =1024;
const floorName = '/calibration_floor';
const modelName = '/air_max_98_la_mezcla';
var exrCubeRenderTarget, exrBackground;
var index = 0;

/*
** Setup your lighting
*/

function setLighting() {
	// Set an ambiant light from sky to ground 
	var hemiLight = new THREE.HemisphereLight( 0xc0e0ff, 0xffe0c0, 0.5 );
	scene.add( hemiLight );

	// Set a spotlight
	var spotLight = new THREE.SpotLight( 0xfff0e0, 0.5 );
	spotLight.angle = Math.PI / 4;
	spotLight.penumbra = 0.5;
	spotLight.position.set( -5, 25, 5 );
	// Allow it to cast shadow
	spotLight.castShadow = true;
	spotLight.shadow.mapSize.width = spotLight.shadow.mapSize.height = shadowRes;
	spotLight.shadow.radius = 2.0;
	scene.add( spotLight );

	// Set HDRI environment
	THREE.DefaultLoadingManager.onLoad = function ( ) {
		pmremGenerator.dispose();
	};
	new EXRLoader().load( path + res + '/studio_small_05_' + res + '.exr', function ( texture ) {
		exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
		exrBackground = exrCubeRenderTarget.texture;
		texture.dispose();
	} );
	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();
}

/*
** Setup your renderer
*/

function setRenderer() {
	// Define the rendering container
	container = document.getElementById("threejs-container");

	// Set up the fps stats
	stats = new Stats();
	container.appendChild( stats.dom );

	// Set up the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	// Allow it to render shadows and set its tone mapping
	renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.75;
	renderer.outputEncoding = THREE.sRGBEncoding;
	// Assign it to the container
	container.appendChild( renderer.domElement );
}

/*
** Setup your environment
*/

function setEnvironment() {
	// Create a room
	var geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
	geometry.addAttribute( 'uv2', new THREE.BufferAttribute( geometry.attributes.uv.array, 2 ) );
	geometry.attributes.uv2 = geometry.attributes.uv;
	// Create a material visible from its back side and set its textures
	var material = new THREE.MeshStandardMaterial( { side: THREE.BackSide } );
	var loader = new THREE.TextureLoader();
	material.map = new THREE.TextureLoader().load( path + res + floorName + '_diff_' + res + '.jpg' );
	material.normalMap = loader.load( path + res + floorName + '_nor_gl_' + res + '.jpg' );
	material.normalScale.set( 0.5, 0.5 );
	material.aoMap = loader.load( path + res + floorName + '_ao_' + res + '.jpg' );
	material.roughnessMap = loader.load( path + res + floorName + '_rough_' + res + '.jpg' );
	material.roughness = 1.0;
	material.metalnessMap = material.roughnessMap;
	material.metalness = 1.0;
	material.envMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
	material.envMapIntensity = 0.5;

	// Add it to the scene
	var cube = new THREE.Mesh( geometry, material );
	cube.receiveShadow = true;
	cube.position.set( 0., 10., 0. );
	cube.scale.set( -1., 1., 1. );
	scene.add( cube );
}

/*
** Setup your model
*/

function setModel() {
	var index = 0;
	// Create a material and set its textures
	var material = new THREE.MeshStandardMaterial();
	var loader = new THREE.TextureLoader();
	material.map = loader.load( path + res + modelName + '_diff_' + res + '.jpg' );
	material.normalMap = loader.load( path + res + modelName + '_nor_gl_' + res + '.jpg' );
	material.aoMap = loader.load( path + res + modelName + '_ao_' + res + '.jpg' );
	material.roughnessMap = loader.load( path + res + modelName + '_rough_' + res + '.jpg' );
	material.roughness = 1.25;
	material.metalnessMap = material.roughnessMap;
	material.metalness = 1.0;
	material.envMapIntensity = 0.5;

	// Load a fbx model
	new FBXLoader().load( 'models' + modelName + '.fbx', function ( object ) {
		object.traverse( function ( mesh, index ) {
			if ( mesh.isMesh ) {
				var geometry = mesh.geometry;
				geometry.attributes.uv2 = geometry.attributes.uv;
				mesh.material = material;
				mesh.material.envMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				index++;
			}
		} );
		object.scale.set( 0.1, 0.1, 0.1 );
		model = object;
		scene.add( model );
	} );
}

/*
** Initialize your scene
*/

function initScene() {
	setRenderer();
	
	// Create your scene
	scene = new THREE.Scene();

	// Create your camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.set( 0, 2.5, 6.125);

	// Create your camera controls
	controls = new OrbitControls( camera, renderer.domElement );
	controls.target = new THREE.Vector3(0, 2.5, 0);
	// Set its constraints
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.minDistance = 2.5;
	controls.maxDistance = 50;
	controls.maxPolarAngle = 3 * Math.PI / 4;

	setLighting();
//	setEnvironment();
	setModel();

	window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
	renderer.setSize( container.clientWidth, container.clientHeight );
	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix()
}

/*
** Animate your scene
*/

function animScene() {
	requestAnimationFrame( animScene);
	model.rotation.y += Math.PI / 720.0;
	scene.background = exrBackground;

	stats.update();
	controls.update();
	renderer.render( scene, camera );
};

initScene();
animScene();