import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import testVertexShader from './shaders/test/vertex.glsl'
import testFragmentShader from './shaders/test/fragment.glsl'
import secondFragmentShader from './shaders/test/fragment2.glsl'
import secondVertexShader from './shaders/test/vertex2.glsl'


/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scenes
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
const texture = textureLoader.load('/textures/2.jpg')
const dataTexture = createDataTexture()

// const dataTexture = createDataTexture();

/**
 * Render Buffers for Ping Pong
 */
// Create a new framebuffer we will use to render to
// the video card memory
let renderBufferA = new THREE.WebGLRenderTarget(
    sizes.width,
    sizes.height,
    {
        // In this demo UV coordinates are float values in the range of [0,1]. 
        // If you render these values into a 32bit RGBA buffer (a render target in format RGBA and type UnsignedByte), you will lose precision since you can only store 8 bit (256 possible integer values) per color channel. 
        // This loss is visible if you use the sampled uv coordinates for a texture fetch.
        // You can fix the issue if you add this parameter when creating the render target type: THREE.FloatType. 
        // The underlying texture is now a float texture that can hold your uv coordinates and retain precision.
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        stencilBuffer: false
    }
)

let renderBufferB = new THREE.WebGLRenderTarget(
    sizes.width,
    sizes.height,
    {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        stencilBuffer: false
    }
)

/**
 * Meshes
 */
// Geometry
const geometry = new THREE.PlaneBufferGeometry(2, 2);
const zoom = 0.3;

const resolution = new THREE.Vector3(sizes.width, sizes.height, window.devicePixelRatio)
// Buffer Material
const bufferMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: dataTexture },
        uResolution: {
            value: resolution
        },
        uTime: { value: 0.0 },
        uMouse: { value: new THREE.Vector3() },
        uZoom: { value: zoom },
        uFrame: { value: 0 }
    },
    vertexShader: testVertexShader,
    fragmentShader: testFragmentShader,
});

const quadMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: null },
        uResolution: {
            value: resolution
        },

        uTime: { value: 0.0 },
        uZoom: { value: zoom }
    },
    vertexShader: testVertexShader,
    fragmentShader: secondFragmentShader,
});

// Meshes
const bufferMesh = new THREE.Mesh(geometry, bufferMaterial);
bufferScene.add(bufferMesh)

const mesh = new THREE.Mesh(geometry, quadMaterial);
scene.add(mesh)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer()
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement);



renderer.domElement.addEventListener('mousedown', () => {
    bufferMaterial.uniforms.uMouse.value.z = 1;
})

renderer.domElement.addEventListener('mouseup', () => {
    bufferMaterial.uniforms.uMouse.value.z = 0;

})

renderer.domElement.addEventListener('mousemove', e => {
    //update uniforms
    bufferMaterial.uniforms.uMouse.value.x = e.clientX;
    bufferMaterial.uniforms.uMouse.value.y = sizes.height - e.clientY;

    console.log(bufferMaterial.uniforms.uMouse.value)
})



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



    //update uniforms
    bufferMaterial.uniforms.uResolution.value.x = sizes.width
    bufferMaterial.uniforms.uResolution.value.y = sizes.height
}

window.addEventListener('resize', onWindowResize)

/**
 * Camera
 */
// Base camera
const camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
// camera.position.set(0, 0, 1);
//scene.add(camera)
// bufferScene.add(camera)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {

    const elapsedTime = clock.getElapsedTime()

    bufferMesh.material.uniforms.uTime.value = elapsedTime;
    bufferMesh.material.uniforms.uFrame.value += 1;
    // Explicitly set renderBufferA as the framebuffer to render to
    //the output of this rendering pass will be stored in the texture associated with FBO_B
    renderer.setRenderTarget(renderBufferA)
    // This will contain our ping-pong accumulated texture
    renderer.render(bufferScene, camera)

    //grab that texture and map it to the full screen quad
    //then draw the full sceen quad to the on screen buffer, ie, the display
    //mesh.material.map = renderBufferA.texture

    mesh.material.uniforms.uTexture.value = renderBufferA.texture;
    renderer.setRenderTarget(null)
    renderer.render(scene, camera);

    // 👇
    // Ping-pong our framebuffers by swapping them
    // at the end of each frame render
    //Now prepare for the next cycle by swapping FBO_A and FBO_B
    //so that the previous frame's *output* becomes the next frame's *input*
    const temp = renderBufferA
    renderBufferA = renderBufferB
    renderBufferB = temp
    bufferMaterial.uniforms.uTexture.value = renderBufferB.texture;

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

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

    // just a weird thing that Three.js wants you to do after you set the data for the texture
    texture.needsUpdate = true;

    return texture;

}