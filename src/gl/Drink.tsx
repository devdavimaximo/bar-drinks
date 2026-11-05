import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Look } from '../content';
import { LITE, REDUCED, damp, easeInOut } from '../lib/env';
import { onReady, signals } from '../lib/scroller';
import AdaptiveDpr from './AdaptiveDpr';
import { fragment, vertex } from './drinkShader';
import { buildState, camAt, cardCam, introRise, spinAt } from './build';
import { makeUniforms, mixState, pushState, stateFromLook, type DrinkState } from './state';

/**
 * Desenho sob demanda, como no bolo do docesfinos: o canvas só redesenha quando
 * algo muda (scroll, mouse, entrada, troca de drink). A taça gira sempre, mas
 * devagar: no celular, a 30 fps. `chained` diz ao AdaptiveDpr se o quadro veio
 * logo depois do anterior, para pausas não contarem como lentidão.
 */

type Mode = { kind: 'hero' } | { kind: 'card'; look: Look };

function Scene({ mode, render }: { mode: Mode; render: { chained: boolean } }) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const st = useRef({ build: 0, mx: 0, my: 0, t: 0, frames: 0, timer: 0, swap: 1, from: null as DrinkState | null, to: null as DrinkState | null });
  const buf = useMemo(() => new THREE.Vector2(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment(LITE),
        uniforms: makeUniforms(),
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      material.uniforms.uNoise.value.dispose();
      material.dispose();
    },
    [material],
  );

  // sinais que nascem fora do canvas acordam o desenho
  useEffect(() => {
    const wake = () => invalidate();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('pointermove', wake, { passive: true });
    const off = onReady(wake);
    const s = st.current;
    return () => {
      window.removeEventListener('scroll', wake);
      window.removeEventListener('pointermove', wake);
      window.clearTimeout(s.timer);
      off();
    };
  }, [invalidate]);

  // carta: um drink novo começa a transição a partir do que está na tela agora
  const look = mode.kind === 'card' ? mode.look : null;
  useEffect(() => {
    if (!look) return;
    const s = st.current;
    const next = stateFromLook(look);
    s.from = s.to && s.from ? mixState(s.from, s.to, easeInOut(Math.min(s.swap, 1))) : next;
    s.to = next;
    s.swap = REDUCED ? 1 : 0;
    invalidate();
  }, [look, invalidate]);

  useFrame((_, delta) => {
    const s = st.current;
    const dt = Math.min(delta, 1 / 20);
    if (!REDUCED) s.t += dt;
    s.mx = damp(s.mx, signals.mx, 2.4, dt);
    s.my = damp(s.my, signals.my, 2.4, dt);
    const u = material.uniforms as ReturnType<typeof makeUniforms>;
    const aspect = size.width / size.height;

    let moving = Math.abs(signals.mx - s.mx) > 1e-3 || Math.abs(signals.my - s.my) > 1e-3;
    let rise = 1;
    if (mode.kind === 'hero') {
      s.build = damp(s.build, signals.build, REDUCED ? 30 : 6, dt);
      const since = signals.introAt < 0 ? 0 : (performance.now() - signals.introAt) / 1000;
      rise = REDUCED ? (signals.introAt < 0 ? 0 : 1) : introRise(since);
      pushState(u, buildState(s.build));
      const cam = camAt(s.build, aspect, s.mx, s.my, rise);
      u.uRo.value.set(...cam.ro);
      u.uTa.value.set(...cam.ta);
      u.uFocal.value = cam.focal;
      u.uSpin.value = spinAt(s.build, s.t, s.mx);
      u.uExpo.value = rise;
      u.uVig.value = 0.34;
      moving ||= Math.abs(signals.build - s.build) > 1e-4 || rise < 1;
    } else if (s.from && s.to) {
      s.swap = Math.min(s.swap + dt / 1.1, 1);
      pushState(u, mixState(s.from, s.to, easeInOut(s.swap)));
      // no meio da troca a bebida balança
      u.uWave.value = Math.sin(s.swap * Math.PI) * 0.8;
      const cam = cardCam(aspect);
      u.uRo.value.set(cam.ro[0] + s.mx * 0.25, cam.ro[1] - s.my * 0.12, cam.ro[2]);
      u.uTa.value.set(...cam.ta);
      u.uFocal.value = cam.focal;
      u.uSpin.value = s.t * 0.3 + s.mx * 0.4;
      u.uExpo.value = 1;
      u.uVig.value = 0.5;
      moving ||= s.swap < 1;
    }

    gl.getDrawingBufferSize(buf);
    u.uRes.value.copy(buf);
    u.uTime.value = s.t;

    // o segundo quadro só chega depois que o programa compilou: avisa o preloader
    if (++s.frames === 2 && mode.kind === 'hero') {
      (window as unknown as { __glReady?: boolean }).__glReady = true;
      window.dispatchEvent(new Event('drink:ready'));
    }

    const started = mode.kind === 'card' || signals.introAt >= 0;
    const busy = s.frames < 3 || moving;
    // a taça gira sempre (a bebida tem bolhas e ondas); no celular, a 30 fps
    const sway = started && !REDUCED;
    window.clearTimeout(s.timer);
    render.chained = busy || (sway && !LITE);
    if (render.chained) invalidate();
    else if (sway) s.timer = window.setTimeout(() => invalidate(), 1000 / 30 - 4);
  });

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/** o canvas só desenha enquanto está na tela */
export default function Drink({ mode, className }: { mode: Mode; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(mode.kind === 'hero');
  const render = useMemo(() => ({ chained: false }), []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const max = Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 1.5);

  return (
    <div className={className} ref={host} aria-hidden="true">
      <Canvas
        frameloop={visible ? 'demand' : 'never'}
        dpr={max}
        gl={{ alpha: false, antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 1] }}
      >
        <AdaptiveDpr min={LITE ? 0.5 : 0.6} max={max} chained={() => render.chained} />
        <Scene mode={mode} render={render} />
      </Canvas>
    </div>
  );
}
