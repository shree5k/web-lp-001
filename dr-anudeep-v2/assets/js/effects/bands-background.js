/* Bands shader extracted from Ornn's ThemePersistence.CHlzVhXh.mjs.
 * Source: https://framerusercontent.com/sites/2RwUbcAvCZYM2s4tdnIxQT/ThemePersistence.CHlzVhXh.mjs
 * Original fragment SHA-256: c9464850f5ed3e79f751cb6e2bf8c8bc42c3dbd9c6c725754486713c2dbe0169 */
(function (scope) {
 'use strict';
 const ORIGINAL_FRAGMENT = "\nconst int SAMPLES = 8;\nconst float EPHEMERAL_DRIP = 1.0;\n\n// === PCG hash - https://www.jcgt.org/published/0009/03/02/\nuvec3 hash3(uvec3 v) {\n    v = v * 1664525u + 1013904223u;\n    v.x += v.y * v.z;\n    v.y += v.z * v.x;\n    v.z += v.x * v.y;\n    v ^= v >> 16u;\n    v.x += v.y * v.z;\n    v.y += v.z * v.x;\n    v.z += v.x * v.y;\n    return v;\n}\nuvec3 seed;\nvec3 random3f() {\n    seed = hash3(seed);\n    return vec3(seed) / float(-1u);\n}\n\nvec3 seedRandom(float seedVal) {\n    uvec3 s = uvec3(\n        floatBitsToUint(seedVal),\n        floatBitsToUint(seedVal * 1.5 + 7.31),\n        floatBitsToUint(seedVal * 2.7 + 13.37)\n    );\n    s = hash3(s);\n    return vec3(s) / float(0xFFFFFFFFu);\n}\n\n// === PALETTE SAMPLING ===\nvec3 getColor(int idx) {\n    if (u_colors_length < 1) return vec3(0.0);\n    int safeIdx = clamp(idx, 0, u_colors_length - 1);\n    return u_colors[safeIdx].rgb;\n}\n\nvec3 paletteN(float t, int count) {\n    if (count < 1) return vec3(0.0);\n    if (count < 2) return getColor(0);\n    t = clamp(t, 0.0, 1.0) * float(count - 1);\n    int idx = min(int(floor(t)), count - 2);\n    float localT = fract(t);\n    localT = localT * localT * (3.0 - 2.0 * localT);\n    return mix(getColor(idx), getColor(idx + 1), localT);\n}\n\n// === Gradient Flow ===\nfloat getGradientT(vec2 uv, float t, vec3 s1, vec3 s2) {\n    // Seed-derived flow directions\n    float angle1 = s1.x * 6.28;\n    float angle2 = s1.y * 6.28;\n    vec2 dir1 = vec2(cos(angle1), sin(angle1));\n    vec2 dir2 = vec2(cos(angle2), sin(angle2));\n    \n    // Seed-derived frequencies\n    float freq1 = 1.0 + s1.z * 2.0;\n    float freq2 = 1.0 + s2.x * 1.5;\n    float freq3 = 1.5 + s2.y * 2.0;\n    \n    float flow = dot(uv, dir1) + sin(dot(uv, dir2) * freq1 + t) * 0.3 + t * 0.2;\n    float flow2 = dot(uv, dir2.yx) + cos(dot(uv, dir1.yx) * freq2 - t * 0.8) * 0.25;\n    \n    float gradT = sin(flow * 1.5) * 0.5 + 0.5;\n    gradT += cos(flow2 * 1.2) * 1.3;\n    gradT += sin(dot(uv, dir1 + dir2) * freq3 + t * 3.5) * 1.2;\n    \n    return smoothstep(0.0, 4.12, gradT);\n}\n\n// === BAND LENS ===\nvoid applyBandLens(vec2 pp, float radiusSq, float iorOffset, out vec2 warpedUV, out float edgeFactor) {\n    vec2 ppLens = pp;\n    float spacingX = max(u_lensSpacingX, 0.001);\n    float spacingY = max(u_lensSpacingY, 0.001);\n    ppLens.x = fract(pp.x / spacingX + 0.5) * spacingX - spacingX * 0.5;\n    ppLens.y = fract(pp.y / spacingY + 0.5) * spacingY - spacingY * 0.5;\n\n    float sp = radiusSq - ppLens.x * ppLens.x - ppLens.y * ppLens.y;\n    \n    float lensAmount = smoothstep(-0.1, 0.05, sp);\n    float baseLens = sqrt(max(sp, -sp * 0.1) / 0.3);\n    edgeFactor = (1.0 - smoothstep(0.0, radiusSq, sp)) * lensAmount;\n    \n    float warpAmount = mix(1.0, baseLens * (1.0 + iorOffset), lensAmount);\n    \n    warpedUV = pp;\n    warpedUV.x += (ppLens.x * warpAmount - ppLens.x);\n    warpedUV.y *= warpAmount;\n}\n\nvoid main() {\n    vec2 fragCoord = v_uv * u_resolution;\n    seed = uvec3(uvec2(fragCoord), uint(fract(u_time) * 1000.0));\n    \n    vec2 r = u_resolution;\n    vec2 p = (fragCoord * 2.0 - r) / r.y;\n    float t = u_time * u_speed;\n    \n    int colorCount = u_colors_length;\n    \n    // Early out: no colors -> black\n    if (colorCount < 1) {\n        fragColor = vec4(0.0, 0.0, 0.0, 1.0);\n        return;\n    }\n    \n    // Seed-based offsets for gradient flow\n    vec3 seedOff1 = seedRandom(u_seed);\n    vec3 seedOff2 = seedRandom(u_seed + 100.0);\n    \n    float dice = random3f().x;\n    \n    float radiusSq = u_lensRadius * u_lensRadius;\n    vec3 iorOffsets = vec3(-1.0, 0.0, 1.0) * u_dispersionStrength;\n    \n    vec3 col = vec3(0.0);\n    \n    for (int i = 0; i < SAMPLES; i++) {\n        float ephemeral = (float(i) + dice) / float(SAMPLES);\n        float sqEph = ephemeral * ephemeral;\n        \n        vec2 pt = p;\n        pt.x += u_ephemeralAmp * sqEph * sin(p.y * 2.0 + t);\n        pt.y += u_ephemeralAmp * sqEph * cos(p.x * 1.5 - t) * 0.5;\n        pt.y -= (1.0 - exp(-EPHEMERAL_DRIP * sqEph)) * abs(pt.y) * sign(pt.y) * 0.3;\n        \n        vec3 tint = smoothstep(1.0, 0.0, abs(3.0 * ephemeral - vec3(1.0, 1.5, 2.0)));\n        \n        vec3 gradTs = vec3(0.0);\n        vec3 edgeFactors = vec3(0.0);\n        \n        for (int c = 0; c < 3; c++) {\n            vec2 pp = pt * u_lensScale;\n            vec2 warpedUV;\n            float edgeFactor;\n            applyBandLens(pp, radiusSq, iorOffsets[c], warpedUV, edgeFactor);\n            \n            vec2 gradUV = warpedUV / u_lensScale;\n            gradTs[c] = getGradientT(gradUV, t * 0.8, seedOff1, seedOff2);\n            edgeFactors[c] = edgeFactor;\n        }\n        \n        vec3 convergentColor = paletteN(gradTs.g, colorCount);\n        float edgeMix = max(max(edgeFactors.r, edgeFactors.g), edgeFactors.b);\n        \n        vec3 dispersedColor = vec3(\n            paletteN(gradTs.r, colorCount).r,\n            convergentColor.g,\n            paletteN(gradTs.b, colorCount).b\n        );\n        \n        vec3 finalColor = mix(convergentColor, dispersedColor, edgeMix * 2.0);\n        \n        vec3 rainbow = (gradTs - gradTs.g) * 3.0;\n        finalColor += rainbow * edgeMix * u_edgeDisp;\n        \n        col += tint * finalColor * (3.0 / float(SAMPLES));\n    }\n    \n    fragColor = vec4(col, 1.0);\n}\n";
 const VERTEX_SOURCE = `#version 300 es
 precision highp float;
 in vec2 a_position;
 out vec2 v_uv;
 void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }
 `;
 const FRAGMENT_SOURCE = `#version 300 es
 precision highp float;
 precision highp int;
 in vec2 v_uv;
 out vec4 fragColor;
 uniform vec2 u_resolution;
 uniform float u_time;
 uniform vec4 u_colors[8];
 uniform int u_colors_length;
 uniform float u_dispersionStrength;
 uniform float u_edgeDisp;
 uniform float u_ephemeralAmp;
 uniform float u_lensRadius;
 uniform float u_lensScale;
 uniform float u_lensSpacingX;
 uniform float u_lensSpacingY;
 uniform float u_seed;
 uniform float u_speed;
 ` + ORIGINAL_FRAGMENT;
 const SETTINGS = Object.freeze({
  u_dispersionStrength: 0, u_edgeDisp: 0.6, u_ephemeralAmp: 0,
  u_lensRadius: 0.58, u_lensScale: 10, u_lensSpacingX: 1.21,
  u_lensSpacingY: 0.01, u_seed: 113, u_speed: 0.15
 });
 // Framer's onScrollTarget threshold=1 interpolates over each target's height,
 // starting when its top reaches the viewport bottom. The section fades 0→1,
 // followed by the footer target's 1→0 transition.
 function scrollOpacity(rect, footerRect, viewportHeight) {
  const clamp = value => Math.max(0, Math.min(1, value));
  const enter = clamp((viewportHeight - rect.top) / Math.max(1, rect.height));
  const exit = footerRect ? clamp((viewportHeight - footerRect.top) / Math.max(1, footerRect.height)) : 0;
  return Math.min(enter, 1 - exit);
 }
 function createBandsRenderer(section, env) {
  const ambient = section.getAttribute?.('data-bands-motion') === 'ambient';
  const canvas = section.querySelector('canvas');
  const fallback = section.querySelector('.bands-background__fallback');
  const background = section.querySelector('.bands-background');
  const footer = env.document.querySelector?.('footer');
  const originTime = env.performance?.now() || 0;
  const media = env.matchMedia('(prefers-reduced-motion: reduce)');
  let gl = null, program = null, buffer = null, vao = null;
  let shaders = [], locations = {}, frame = null;
  let visible = false, failed = false, lost = false, suspended = false, destroyed = false;
  let resizeObserver, intersectionObserver;
  function cancel() {
   if (frame !== null) env.cancelAnimationFrame(frame);
   frame = null;
  }
  function release() {
   cancel();
   if (gl) {
    if (buffer) gl.deleteBuffer(buffer);
    if (vao) gl.deleteVertexArray(vao);
    if (program) gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
   }
   gl = null; program = null; buffer = null; vao = null; shaders = []; locations = {};
   canvas.hidden = true;
  }
  function fail(error) {
   failed = true; release();
   env.console?.warn('Animated background unavailable; showing its still image.', error);
  }
  function compile(type, source) {
   const shader = gl.createShader(type);
   if (!shader) throw new Error('Cannot create shader');
   shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
   return shader;
  }
  function layout() {
   const rect = section.getBoundingClientRect();
   const width = ambient ? rect.width : (env.innerWidth || rect.width);
   const height = ambient ? rect.height : (env.innerHeight || rect.height);
   // Keep the field fixed in viewport coordinates while clipping it to this section.
   for (const layer of [canvas, fallback]) {
    if (!layer) continue;
    layer.style.width = `${width}px`; layer.style.height = `${height}px`;
    layer.style.left = ambient ? '0px' : `${-(rect.left || 0)}px`;
    layer.style.top = ambient ? '0px' : `${-rect.top}px`;
   }
   if (background) background.style.opacity = ambient || media.matches ? '1' : String(scrollOpacity(rect, footer?.getBoundingClientRect(), height));
   return { width, height };
  }
  function resize() {
   if (destroyed) return;
   const size = layout();
   if (!gl) return;
   const dpr = Math.min(env.devicePixelRatio || 1, size.width <= 767 ? 1 : 1.5);
   const width = Math.max(1, Math.min(4096, Math.round(size.width * dpr)));
   const height = Math.max(1, Math.min(4096, Math.round(size.height * dpr)));
   if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
   gl.viewport(0, 0, width, height);
   gl.uniform2f(locations.u_resolution, width, height);
  }
  function scroll() { if (!destroyed) layout(); }
  function initialize() {
   gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
   if (!gl) throw new Error('WebGL2 is unavailable');
   const vertex = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
   const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
   program = gl.createProgram();
   if (!program) throw new Error('Cannot create shader program');
   gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader linking failed');
   gl.useProgram(program);
   vao = gl.createVertexArray(); buffer = gl.createBuffer();
   if (!vao || !buffer) throw new Error('Cannot create drawing resources');
   gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
   const position = gl.getAttribLocation(program, 'a_position');
   if (position < 0) throw new Error('Shader position attribute is unavailable');
   gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
   ['u_resolution', 'u_time', 'u_colors[0]', 'u_colors_length', ...Object.keys(SETTINGS)].forEach(name => { locations[name] = gl.getUniformLocation(program, name); });
   Object.entries(SETTINGS).forEach(([name, value]) => gl.uniform1f(locations[name], value));
   gl.uniform4fv(locations['u_colors[0]'], new Float32Array([0, 0, 0, 1, 209 / 255, 140 / 255, 71 / 255, 1, 0, 0, 0, 1]));
   gl.uniform1i(locations.u_colors_length, 3);
   resize();
  }
  function shouldRun() { return !destroyed && !failed && !lost && !suspended && visible && !media.matches && !env.document.hidden; }
  function draw(time) {
   frame = null;
   if (!shouldRun()) return;
   try {
    // Match the shared reference shader clock even though offscreen rendering is paused.
    const elapsed = Math.max(0, time - originTime) / 1000;
    layout();
    gl.useProgram(program); gl.bindVertexArray(vao);
    gl.uniform1f(locations.u_time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.hidden = false;
    frame = env.requestAnimationFrame(draw);
   } catch (error) { fail(error); }
  }
  function sync() {
   cancel();
   layout();
   if (media.matches) canvas.hidden = true;
   if (!shouldRun()) return;
   try {
    if (!gl) initialize();
    frame = env.requestAnimationFrame(draw);
   } catch (error) { fail(error); }
  }
  function contextLost(event) {
   event.preventDefault(); lost = true; release();
  }
  function contextRestored() { lost = false; failed = false; sync(); }
  function pageHide(event) { if (!event.persisted) destroy(); else { suspended = true; cancel(); } }
  function pageShow() { suspended = false; sync(); }
  function destroy() {
   if (destroyed) return;
   destroyed = true; release();
   intersectionObserver?.disconnect(); resizeObserver?.disconnect();
   media.removeEventListener('change', sync);
   env.document.removeEventListener('visibilitychange', sync);
   env.removeEventListener('scroll', scroll);
   env.removeEventListener('resize', resize); env.removeEventListener('pagehide', pageHide); env.removeEventListener('pageshow', pageShow);
   canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
  }
  canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
  media.addEventListener('change', sync); env.document.addEventListener('visibilitychange', sync);
  if (!ambient) env.addEventListener('scroll', scroll, { passive: true });
  env.addEventListener('resize', resize); env.addEventListener('pagehide', pageHide); env.addEventListener('pageshow', pageShow);
  if (env.ResizeObserver) { resizeObserver = new env.ResizeObserver(resize); resizeObserver.observe(section); }
  layout();
  if (env.IntersectionObserver) {
   intersectionObserver = new env.IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }, { threshold: 0 });
   intersectionObserver.observe(section);
  } else { visible = true; sync(); }
  return { destroy };
 }
 function initializeBandsSections(env) {
  return [...env.document.querySelectorAll('[data-bands-background]')].map(section => createBandsRenderer(section, env));
 }
 const api = { initializeBandsSections, createBandsRenderer, scrollOpacity, SETTINGS, ORIGINAL_FRAGMENT, FRAGMENT_SOURCE, VERTEX_SOURCE };
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 else if (scope?.document) {
  initializeBandsSections(scope);
 }
})(typeof window !== 'undefined' ? window : null);
