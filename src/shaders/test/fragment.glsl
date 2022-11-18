precision mediump float;

uniform sampler2D uTexture; //Our input texture
uniform vec3 uResolution;
uniform vec3 uMouse;
//uniform vec2 textureSize; //The width and height of our screen
uniform float uTime;
uniform int uFrame;
uniform float uZoom;

varying vec2 vUvs;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

float GetNeighbours(vec2 p) {
    float count = 0.0;

    for(float y = -1.0; y <= 1.0; y++) {
        for(float x = -1.0; x <= 1.0; x++) {

            if(x == 0.0 && y == 0.0)
                continue;

            // Scale the offset down
            vec2 offset = vec2(x, y) / uResolution.xy;	
            // Apply offset and sample texture	 
            vec4 lookup = texture2D(uTexture, p + offset); 
             // Accumulate the result
            count += lookup.r > 0.5 ? 1.0 : 0.0;
        }
    }

    return count;
}

void main() {

    /*
		Using a tempoary variable for the output value for clarity.
		it is just passed to fragColor at the end of the function.
	*/
    vec3 color = vec3(0.0);

    /*
		Neighborhood!
		We count all the live cells in a 3 wide, 3 tall area
		centered on this cell.
		 _ _ _
		|_|_|_|     [-1, -1], [0, -1], [1, -1],
		|_|_|_|  =  [-1,  0], [0,  0], [1,  0],
		|_|_|_|     [-1,  1], [0,  1], [1,  1],

		Since each cell only should hold a value of either 0 (dead) or 1 (alive),
		the count yields an integer value, but since the
		texture sampling returns a float, we will use that instead.
	*/ 

    float neighbors = 0.0;

    if(uFrame % 5 != 0) {
        color = texture2D(uTexture, vUvs).xyz;
    } else {

        neighbors += GetNeighbours(vUvs);

        bool alive = texture2D(uTexture, vUvs).x > 0.5;

        if(alive && (neighbors == 2.0 || neighbors == 3.0)) { //cell is alive
            float colVal = remap(neighbors, 0.0, 3.0, 0.5, 1.0);

      		//Any live cell with two or three live neighbours lives on to the next generation.
            color = vec3(1.0, 0.5, 1.0);

        //cell is dead
        } else if(!alive && (neighbors == 3.0)) { 
        //Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
            color = vec3(1.0, 0.0, 0.0);

        }
    }

    vec2 mouse = uMouse.xy / uResolution.xy * uZoom;

    if(uMouse.z > 0.5 && length(mouse - vUvs) < 0.001) {
        color = vec3(1.0);
    }
    gl_FragColor = vec4(color, 1.0);

    //gl_FragColor = vec4(vUvs, 0.0, 1.0);
    //gl_FragColor = texture2D(uTexture, vUvs);

    // gl_FragColor = vec4(uMouse.xy / uResolution.xy, 0., 1.);

}