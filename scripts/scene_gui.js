/*
** Dependencies of this three.js scene
*/

import * as THREE from 'https://unpkg.com/three@0.121.1/build/three.module.js';
import Stats from 'https://unpkg.com/three@0.121.1/examples/jsm/libs/stats.module.js';
import { GUI } from 'https://unpkg.com/three@0.121.1/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.121.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.121.1/examples/jsm/loaders/FBXLoader.js';
import { EXRLoader } from 'https://unpkg.com/three@0.121.1/examples/jsm/loaders/EXRLoader.js';

/*
** Global variables
*/

var stats, container, renderer, scene, camera, controls;
const loader = new THREE.TextureLoader();
var primitive;

// GUI variables
const guiSettings = {
    hdriName: 'studio_small_04'
}
var hdriNames = [ 'studio_small_01', 'studio_small_02', 'studio_small_03', 'studio_small_04' ];

// HDRI variables
var exrCubeRenderTarget, exrBackground;

const params = {
    envMap: 'HDR',
    roughness: 0.0,
    metalness: 0.0,
    exposure: 1.0,
    debug: false
};

/*
** Setup your renderer
*/

function setRenderer() {
    container = document.getElementById("threejs-container");

    stats = new Stats();
    container.appendChild( stats.dom );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );
}

/*
** Setup hdri
*/

function setHdri()
{
	THREE.DefaultLoadingManager.onLoad = function() { pmremGenerator.dispose(); };

	new EXRLoader().load( 'textures/2k/' + guiSettings.hdriName + '_2k.exr', function( texture ) {
		exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
		exrBackground = exrCubeRenderTarget.texture;
		texture.dispose();
	} );
	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();
}

/*
** Setup your lighting
*/

function setLighting() {
	var hemiLight = new THREE.HemisphereLight( 0xc0e0ff, 0xffe0c0, 0.5 );
	scene.add( hemiLight );

    var spotLight = new THREE.SpotLight( 0xfff0e0, 0.5 );
    spotLight.angle = Math.PI / 4.;
    spotLight.penumbra = 0.5;
    spotLight.position.set( 5., 25., 5. );
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = spotLight.shadow.mapSize.height = 4096;
    spotLight.shadow.radius = 5.;
    scene.add( spotLight );

    setHdri();
}

/*
** Setup GUI (Global User Interface)
*/

function setGUI() {
    let gui;
    let hdriFolder;

    gui = new GUI();
    hdriFolder = gui.addFolder( 'Environment' );
    hdriFolder.add( guiSettings, 'hdriName', hdriNames ).name( 'HDRI name').listen().onChange( function () { setHdri() } );
}

/*
** Setup environment
*/

function setEnvironment() {
    var geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
    var material = new THREE.MeshStandardMaterial( { side: THREE.BackSide } );
    material.map = loader.load( 'textures/2k/calibration_floor_diff_2k.jpg' );
    material.normalMap = loader.load( 'textures/2k/calibration_floor_nor_gl_2k.jpg' );

    var cube = new THREE.Mesh( geometry, material );
    cube.receiveShadow = true;
    cube.position.set( 0, 10., 0 );
    scene.add ( cube );
}

/*
** Setup a primitive
*/

function setPrimitive() {
	let geometry = new THREE.TorusKnotGeometry( 0.75, 0.25, 150, 20 );
	let material = new THREE.MeshStandardMaterial( {
		metalness: 0.5,
		roughness: 0.,
		envMapIntensity: 1.0
	} );

	primitive = new THREE.Mesh( geometry, material );
	primitive.position.set( 0., 2.5, 0. );
	scene.add( primitive );
}

/*
** Initialize your scene
*/
 
function initScene() {
    setRenderer();
    setGUI();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( 0, 2.5, 7.5 );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.target = new THREE.Vector3(0, 2.5, 0);

    setLighting();
	setEnvironment();
	setPrimitive();

    window.addEventListener( 'resize', onWindowResize );
}

/*
** Animate your scene
*/

function animScene() {
    requestAnimationFrame( animScene );

	scene.background = exrBackground;
	primitive.material.envMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
	primitive.material.needsUpdate = true;

    stats.update();
    controls.update();
    renderer.render( scene, camera );
}

function onWindowResize() {
	renderer.setSize( container.clientWidth, container.clientHeight );
	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix()
}

initScene();
animScene();