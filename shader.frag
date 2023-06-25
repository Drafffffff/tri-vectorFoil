precision mediump float;

uniform vec2 uResolution;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform float u_time;

varying vec2 vTexCoord;
#define PI_TWO 1.570796326794897
#define PI 3.141592653589793
#define TWO_PI 6.283185307179586
void main() {
  // now because of the varying vTexCoord, we can access the current texture
  // coordinate
  vec2 uv = vTexCoord;
  float angle = mod(u_time * 1.5, TWO_PI);
  vec2 pos = vec2(cos(angle), sin(angle)) / 2.5;
  uv.y = 1. - uv.y;
  float a = texture2D(tex0, uv).r;
  vec3 color = vec3(0.);
  color += texture2D(tex1, uv + pos * a * .05).rgb;
  gl_FragColor = vec4(color, 1.);

  // and now these coordinates are assigned to the color output of the shader
}
