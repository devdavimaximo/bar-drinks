/**
 * Textura de ruído do truque do iq: G em (x, y) repete R em (x − 37, y − 239),
 * o que deixa o shader ler duas fatias de z numa leitura só.
 * Devolve os bytes RGBA 256×256; o renderizador sobe com REPEAT e filtro linear.
 */
export const NOISE_SIZE = 256;

export function noiseData() {
  const N = NOISE_SIZE;
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
  return data;
}
