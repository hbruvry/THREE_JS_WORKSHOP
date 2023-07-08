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

// Mixamo variables
const clock = new THREE.Clock();
var dancer, mixer;

// HDRI variables
var exrCubeRenderTarget, exrBackground;

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

	new EXRLoader().load( 'textures/2k/studio_small_04_2k.exr', function( texture ) {
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
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.position.set( 5., 25., 5. );
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = spotLight.shadow.mapSize.height = 4096;
    spotLight.shadow.radius = 5.;
    scene.add( spotLight );

    setHdri();
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
    cube.position.set( 0., 10., 0. );
    scene.add ( cube );
}

/*
** Setup a Mixamo
*/

function setMixamo() {
    new FBXLoader().load( 'models/xbot_silly_dancing.fbx', function( object ) {
		mixer = new THREE.AnimationMixer( object );
		const action = mixer.clipAction( object.animations[ 0 ] );
		action.play();
		object.traverse( function( mesh ) {
            if ( mesh.isMesh )
            {
                let material = mesh.material;
                mesh.material = new THREE.MeshStandardMaterial();
                THREE.MeshStandardMaterial.prototype.copy.call( mesh.material, material );
                mesh.material.roughness = 0.125;
                mesh.material.envMapIntensity = 0.5;
                mesh.material.envMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
	            mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        } );
        object.scale.set( 0.025, 0.025, 0.025 );
        dancer = object;
        scene.add( dancer );
    } );
}

/*
** Initialize your scene
*/
 
function initScene() {
    setRenderer();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( 0., 2.5, 7.5 );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.target = new THREE.Vector3( 0., 2.5, 0. );

    setLighting();
	setEnvironment();
	setMixamo();

    window.addEventListener( 'resize', onWindowResize );
}

/*
** Animate your scene
*/

function animScene() {
    requestAnimationFrame( animScene );

	scene.background = exrBackground;


    const delta = clock.getDelta();
    if ( mixer ) mixer.update( delta );

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