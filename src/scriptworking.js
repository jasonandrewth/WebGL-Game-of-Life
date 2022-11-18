
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

import testVertexShader from './shaders/test/vertex.glsl'
import testFragmentShader from './shaders/test/fragment.glsl'
import secondFragmentShader from './shaders/test/fragment2.glsl'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
const bufferScene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}



/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('/textures/random-pattern.png')
// texture.wrapS = THREE.RepeatWrapping
// texture.wrapT = THREE.RepeatWrapping
const dataTexture = createDataTexture();
// dataTexture.wrapS = THREE.ClampToEdgeWrapping
// dataTexture.wrapT = THREE.ClampToEdgeWrapping

let FBO_A = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
});
let FBO_B = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
});

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(1, 1);

// Material

const bufferMaterial = new THREE.ShaderMaterial({
    uniforms: {
        bufferTexture: { value: dataTexture },
        textureSize: { value: new THREE.Vector2(sizes.width, sizes.height) },  //shader doesn't have access to these global variables, so pass in the resolution
        uResolution: {
            value: new THREE.Vector2(
                sizes.width, sizes.height
            )
        }
    },
    vertexShader: testVertexShader,
    fragmentShader: testFragmentShader,
});

// Quad Material
const quadMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: null },
        uResolution: {
            value: new THREE.Vector2(
                sizes.width, sizes.height
            )
        }
    },
    vertexShader: testVertexShader,
    fragmentShader: secondFragmentShader,
});

// Mesh

const bufferObject = new THREE.Mesh(geometry, bufferMaterial);
bufferObject.position.set(0.5, 0.5, 0);
bufferScene.add(bufferObject);

const mesh = new THREE.Mesh(geometry, quadMaterial);
mesh.position.set(0.5, 0.5, 0);
scene.add(mesh)

const onWindowResize = () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    // camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', onWindowResize)

document.addEventListener('mousemove', (e) => {
    window.addEventListener('resize', onWindowResize, false);

})

/**
 * Camera
 */
// Base camera
const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1000);
camera.position.set(0, 0, 1);
//scene.add(camera)
// bufferScene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer()
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement);

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    renderer.setRenderTarget(FBO_B)
    renderer.render(bufferScene, camera);

    //grab that texture and map it to the full screen quad

    renderer.setRenderTarget(null)
    //mesh.material.map = FBO_B.texture;
    mesh.material.uniforms.uTexture.value = FBO_B.texture;
    //Then draw the full sceen quad to the on screen buffer, ie, the display
    renderer.render(scene, camera);

    //Now prepare for the next cycle by swapping FBO_A and FBO_B, so that the previous frame's *output* becomes the next frame's *input*
    var t = FBO_A;
    FBO_A = FBO_B;
    FBO_B = t;
    bufferMaterial.uniforms.bufferTexture.value = FBO_A.texture;

    // Update controls
    //controls.update()

    //Draw to the active offscreen buffer (whatever is stored in FBO_B), that is the output of this rendering pass will be stored in the texture associated with FBO_B
    //renderer.render(bufferScene, camera, FBO_B);

    //console.log(FBO_B.texture)

    //Pass Time
    // mesh.material.uniforms.uTime.value = elapsedTime

    //mesh.material.map = texture;
    // console.log(FBO_B.texture, mesh.material.map)

    // Render
    //renderer.render(scene, camera)

    //Now prepare for the next cycle by swapping FBO_A and FBO_B, so that the previous frame's *output* becomes the next frame's *input*
    // var t = FBO_A;
    // FBO_A = FBO_B;
    // FBO_B = t;
    // bufferMaterial.uniforms.bufferTexture.value = FBO_A.texture;


}

tick()


/**
 * CREATE RANDOM NOISE TEXTURE
 */

function createDataTexture() {

    // create a buffer with color data

    var size = sizes.width * sizes.height;
    var data = new Uint8Array(4 * size);


    for (var i = 0; i < size; i++) {

        var stride = i * 4;

        if (Math.random() < 0.5) {
            data[stride] = 255;
            data[stride + 1] = 255;
            data[stride + 2] = 255;
            data[stride + 3] = 255;
        }
        else {
            data[stride] = 0;
            data[stride + 1] = 0;
            data[stride + 2] = 0;
            data[stride + 3] = 255;
        }
    }


    // used the buffer to create a DataTexture

    console.log(data);
    var texture = new THREE.DataTexture(data, sizes.width, sizes.height, THREE.RGBAFormat);

    texture.needsUpdate = true; // just a weird thing that Three.js wants you to do after you set the data for the texture

    return texture;

}