import * as THREE from 'three';

/**
 * Textura de ruído do truque do iq: G em (x, y) repete R em (x − 37, y − 239),
 * o que deixa o shader ler duas fatias de z numa leitura só. Usada pelo bolo
 * (raymarching) e pelo relevo fino do bem-casado (crepom, massa).
 */
export function noiseTexture() {
  const N = 256;
  const r = new Uint8Array(N * N);
  let seed = 1337;
  for (let i = 0; i < r.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    r[i] = seed >>> 24;
  }
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      data[i] = r[y * N + x];
      data[i + 1] = r[((y - 239 + N * 2) % N) * N + ((x - 37 + N) % N)];
      data[i + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
