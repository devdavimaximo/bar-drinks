import { fragment, vertex } from './drinkShader';
import { NOISE_SIZE, noiseData } from './noise';
import { makeUniforms, type Uniforms } from './state';

/**
 * WebGL2 cru para um único triângulo de tela: é tudo o que o drink precisa.
 * Substitui three.js + React Three Fiber (~250 KB gzip) por algumas dezenas de linhas.
 *
 * O shader compila com KHR_parallel_shader_compile quando o navegador oferece:
 * o driver trabalha em outra thread e a página continua respondendo (o preloader
 * anima em vez de congelar). `ready` resolve quando o programa está linkado.
 */

const COMPLETION_STATUS_KHR = 0x91b1;

type Loc = WebGLUniformLocation | null;

export class DrinkRenderer {
  readonly u: Uniforms = makeUniforms();
  readonly ready: Promise<void>;
  /** falhou de vez (sem WebGL2, shader não compilou): o fundo do CSS fica no lugar */
  failed = false;
  private gl: WebGL2RenderingContext | null;
  private prog: WebGLProgram | null = null;
  private locs = new Map<string, Loc>();
  private lost = false;
  private onRestore: () => void = () => {};

  constructor(
    readonly canvas: HTMLCanvasElement,
    private lite: boolean,
  ) {
    this.gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    canvas.addEventListener('webglcontextlost', this.handleLost);
    canvas.addEventListener('webglcontextrestored', this.handleRestored);
    this.ready = this.init();
  }

  /** quem desenha avisa como recomeçar quando o contexto volta */
  restored(fn: () => void) {
    this.onRestore = fn;
  }

  private handleLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
  };

  private handleRestored = () => {
    this.lost = false;
    this.prog = null;
    this.locs.clear();
    this.init().then(() => this.onRestore());
  };

  private async init() {
    const gl = this.gl;
    if (!gl) {
      this.failed = true;
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, vertex);
    const fs = sh(gl.FRAGMENT_SHADER, fragment(this.lite));
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    // espera o driver sem bloquear: pergunta a cada quadro se já terminou
    if (gl.getExtension('KHR_parallel_shader_compile'))
      await new Promise<void>((res) => {
        const poll = () => (gl.isContextLost() || gl.getProgramParameter(prog, COMPLETION_STATUS_KHR) ? res() : requestAnimationFrame(poll));
        poll();
      });

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (!gl.isContextLost()) console.error('[drink]', gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(prog));
      this.failed = true;
      return;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(prog);
    this.prog = prog;

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, NOISE_SIZE, NOISE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, noiseData());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(prog, 'uNoise'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'uZero'), 0);
    gl.bindVertexArray(gl.createVertexArray());
    for (const k of Object.keys(this.u)) this.locs.set(k, gl.getUniformLocation(prog, k));
  }

  get usable() {
    return !!this.prog && !this.lost && !this.failed;
  }

  /** tamanho do buffer em pixels; o CSS estica o canvas na caixa */
  setSize(w: number, h: number) {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  draw() {
    const gl = this.gl;
    if (!gl || !this.usable) return;
    const u = this.u;
    u.uRes[0] = this.canvas.width;
    u.uRes[1] = this.canvas.height;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    for (const [k, loc] of this.locs) {
      if (!loc) continue;
      const v = u[k as keyof Uniforms];
      if (typeof v === 'number') gl.uniform1f(loc, v);
      else if (k === 'uIce') gl.uniform4fv(loc, v);
      else if (v.length === 2) gl.uniform2fv(loc, v);
      else if (v.length === 3) gl.uniform3fv(loc, v);
      else gl.uniform4fv(loc, v);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.handleLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleRestored);
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
  }
}
