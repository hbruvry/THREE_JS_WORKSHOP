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
var models = new Array(4);
const path = 'textures/';
const res = '2k';
const shadowRes = 4096;
const floorName = '/calibration_floor';
const modelName = '/brass_vase_0';
var exrCubeRenderTarget, exrBackground;
var count = 128;
var dummy = new THREE.Object3D();

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
	spotLight.shadow.radius = 2.5;
	scene.add( spotLight );

	// Set HDRI environment
	THREE.DefaultLoadingManager.onLoad = function ( ) {
		pmremGenerator.dispose();
	};
	new EXRLoader().load( path + res + '/studio_small_09_' + res + '.exr', function ( texture ) {
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
	material.aoMap = loader.load( path + res + floorName + '_ao_' + res + '.jpg' );
	material.roughnessMap = loader.load( path + res + floorName + '_rough_' + res + '.jpg' );
	material.roughness = 1.25;
	material.metalnessMap = material.roughnessMap;
	material.metalness = 0.25;
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

function setModel( index ) {
	var instanceName = modelName + String( index + 1 );

	// Create a material and set its textures
	var material = new THREE.MeshStandardMaterial( { color: 0xf0a080, side: THREE.DoubleSide } );
	var loader = new THREE.TextureLoader();
	material.map = loader.load( path + res + instanceName + '_diff_' + res + '.jpg' );
	material.normalMap = loader.load( path + res + instanceName + '_nor_gl_' + res + '.jpg' );
	material.aoMap = loader.load( path + res + instanceName + '_ao_' + res + '.jpg' );
	material.roughnessMap = loader.load( path + res + instanceName + '_rough_' + res + '.jpg' );
	material.roughness = 1.0;
	material.metalnessMap = loader.load( path + res + instanceName + '_metal_' + res + '.jpg' );
	material.metalness = 0.875;
	material.envMapIntensity = 0.5;

	// Load a fbx model
	var geometry;
	new FBXLoader().load( 'models' + instanceName + '.fbx', function ( object ) {
		object.traverse( function ( mesh ) {
			if ( mesh.isMesh ) {
				geometry = mesh.geometry.center();
				geometry.attributes.uv2 = geometry.attributes.uv;
				if ( index < 2 )
					geometry.scale( 2.5, 2.5, 2.5 );
				else
					geometry.scale( 5.0, 5.0, 5.0 );
				mesh.material = material;
				mesh.material.envMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
			//	mesh.castShadow = true;
			//	mesh.receiveShadow = true;
			}
			models[ index ] = new THREE.InstancedMesh( geometry, material, count );
			models[ index ].instanceMatrix.setUsage( THREE.DynamicDrawUsage );
		} );
		scene.add( models[ index ] );
		for ( let i = 0; i < count; i++ )
		{
			dummy.position.random().subScalar( 0.5 ).multiplyScalar( 15.0 );
			dummy.position.y += 10.0;
			dummy.rotation.x = Math.random() * Math.PI;
			dummy.rotation.y = Math.random() * Math.PI;
			dummy.rotation.z = Math.random() * Math.PI;
			dummy.updateMatrix();

			models[ index ].setMatrixAt( i, dummy.matrix );
			models[ index ].instanceMatrix.needsUpdate = true;
		}
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
	camera.position.set( 0, 10, 6.125);

	// Create your camera controls
	controls = new OrbitControls( camera, renderer.domElement );
	controls.target = new THREE.Vector3(0, 10, 0);
	// Set its constraints
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.minDistance = 2.5;
	controls.maxDistance = 50;
	controls.maxPolarAngle = 3 * Math.PI / 4;

	setLighting();
	setEnvironment();
	for (let i = 0; i < 4; i++)
		setModel( i );
	window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

	renderer.setSize( container.clientWidth, container.clientHeight );

	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix();

}

/*
** Animate your scene
*/

function animScene() {
	requestAnimationFrame( animScene);
	scene.background = exrBackground;

	stats.update();
	controls.update();

	renderer.render( scene, camera );
};

initScene();
animScene();