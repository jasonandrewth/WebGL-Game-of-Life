precision mediump float;

uniform sampler2D uTexture; //Our input texture
uniform vec2 uResolution;
uniform float uZoom;

varying vec2 vUvs;

void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    //special method to sample from texture
    vec4 initTexture = texture2D(uTexture, vUvs * uZoom);

    vec3 colour = initTexture.rgb;
    vec2 gv = fract(gl_FragCoord.xy * 100.) - 0.5;

    gl_FragColor = vec4(colour, 1.0);

}