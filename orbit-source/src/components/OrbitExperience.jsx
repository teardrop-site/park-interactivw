import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';


const CHAPTERS = [
  {
    text: <>知らないものは、<br />選べない。</>,
    key: 'UNKNOWN'
  },
  {
    text: <>名前を知る。</>,
    key: 'NAME'
  },
  {
    text: <>距離が変わる。</>,
    key: 'DISTANCE'
  },
  {
    text: <>昨日まで背景だったものが、<br />急に自分の未来へ入ってくる。</>,
    key: 'ENTER'
  },
  {
    text: <>まだない未来は、<br />先に決められない。</>,
    key: 'FINAL'
  }
];


const COLORS = [
  '#ffffff',
  '#dff8ff',
  '#8ddcff',
  '#59c4ff',
  '#ffd0e3',
  '#ff89bf',
  '#e7d2ff',
  '#ad96ff',
  '#ffe1a0',
  '#fff4d2'
];


function seeded(seed) {
  let value = seed;

  return () => {
    value =
      (value * 9301 + 49297) %
      233280;

    return value / 233280;
  };
}


function createGlowTexture() {
  const canvas =
    document.createElement('canvas');

  canvas.width = 256;
  canvas.height = 256;

  const ctx =
    canvas.getContext('2d');

  const gradient =
    ctx.createRadialGradient(
      128, 128, 0,
      128, 128, 128
    );

  gradient.addColorStop(
    0,
    'rgba(255,255,255,1)'
  );

  gradient.addColorStop(
    0.06,
    'rgba(255,255,255,1)'
  );

  gradient.addColorStop(
    0.20,
    'rgba(255,255,255,.56)'
  );

  gradient.addColorStop(
    0.46,
    'rgba(255,255,255,.13)'
  );

  gradient.addColorStop(
    1,
    'rgba(255,255,255,0)'
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    256,
    256
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  return texture;
}


/* =========================================================
   DEEP SPACE
========================================================= */

function DeepStars() {
  const ref = useRef();

  const {
    positions,
    colors
  } = useMemo(() => {

    const count = 7600;

    const positions =
      new Float32Array(
        count * 3
      );

    const colors =
      new Float32Array(
        count * 3
      );

    const random =
      seeded(1204);

    const palette =
      COLORS.map(
        color =>
          new THREE.Color(color)
      );


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const radius =
        10 +
        Math.pow(
          random(),
          .46
        ) * 66;

      const theta =
        random() *
        Math.PI *
        2;

      const phi =
        Math.acos(
          2 * random() - 1
        );


      positions[
        i * 3
      ] =
        radius *
        Math.sin(phi) *
        Math.cos(theta);


      positions[
        i * 3 + 1
      ] =
        radius *
        Math.sin(phi) *
        Math.sin(theta);


      positions[
        i * 3 + 2
      ] =
        radius *
        Math.cos(phi);


      const source =
        palette[
          Math.floor(
            random() *
            palette.length
          )
        ];


      const strength =
        .24 +
        random() *
        .76;


      colors[
        i * 3
      ] =
        source.r *
        strength;


      colors[
        i * 3 + 1
      ] =
        source.g *
        strength;


      colors[
        i * 3 + 2
      ] =
        source.b *
        strength;
    }


    return {
      positions,
      colors
    };

  }, []);


  useFrame(
    ({ clock }) => {

      if (!ref.current) {
        return;
      }

      const t =
        clock.getElapsedTime();


      ref.current.rotation.y =
        t * .003;


      ref.current.rotation.x =
        Math.sin(
          t * .035
        ) * .035;

    }
  );


  return (
    <points ref={ref}>

      <bufferGeometry>

        <bufferAttribute
          attach="attributes-position"
          args={[
            positions,
            3
          ]}
        />

        <bufferAttribute
          attach="attributes-color"
          args={[
            colors,
            3
          ]}
        />

      </bufferGeometry>

      <pointsMaterial
        vertexColors
        size={.052}
        sizeAttenuation
        transparent
        opacity={.94}
        depthWrite={false}
      />

    </points>
  );
}


/* =========================================================
   GALAXY BELT
========================================================= */

function GalaxyBelt({
  progress
}) {

  const ref =
    useRef();


  const {
    positions,
    colors
  } = useMemo(() => {

    const count =
      4500;


    const positions =
      new Float32Array(
        count * 3
      );


    const colors =
      new Float32Array(
        count * 3
      );


    const random =
      seeded(818);


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const angle =
        random() *
        Math.PI *
        2;


      const radius =
        3 +
        Math.pow(
          random(),
          .68
        ) * 9;


      const thickness =
        (
          random() -
          .5
        ) * 1.5;


      positions[
        i * 3
      ] =
        Math.cos(angle) *
        radius;


      positions[
        i * 3 + 1
      ] =
        Math.sin(angle) *
        radius *
        .30 +
        thickness;


      positions[
        i * 3 + 2
      ] =
        (
          random() -
          .5
        ) * 7;


      const color =
        new THREE.Color(
          random() > .55
            ? '#71c7ff'
            : '#d9a3ff'
        );


      const intensity =
        .18 +
        random() * .82;


      colors[
        i * 3
      ] =
        color.r *
        intensity;


      colors[
        i * 3 + 1
      ] =
        color.g *
        intensity;


      colors[
        i * 3 + 2
      ] =
        color.b *
        intensity;

    }


    return {
      positions,
      colors
    };

  }, []);


  useFrame(
    ({ clock }) => {

      if (!ref.current) {
        return;
      }


      const t =
        clock.getElapsedTime();


      ref.current.rotation.z =
        t * .012;


      ref.current.rotation.x =
        -.58 +
        Math.sin(
          progress *
          Math.PI
        ) * .43;


      ref.current.rotation.y =
        progress * 1.10;

    }
  );


  return (
    <points ref={ref}>

      <bufferGeometry>

        <bufferAttribute
          attach="attributes-position"
          args={[
            positions,
            3
          ]}
        />

        <bufferAttribute
          attach="attributes-color"
          args={[
            colors,
            3
          ]}
        />

      </bufferGeometry>

      <pointsMaterial
        vertexColors
        size={.037}
        sizeAttenuation
        transparent
        opacity={.58}
        depthWrite={false}
        blending={
          THREE.AdditiveBlending
        }
      />

    </points>
  );
}


/* =========================================================
   ORBIT DATA
========================================================= */

function makeOrbitData() {

  const random =
    seeded(4412);


  return Array.from(
    {
      length: 46
    },
    (_, index) => {

      const direction =
        random() >
        .5
          ? 1
          : -1;


      return {

        radius:
          1.6 +
          random() *
          6.8,

        flatten:
          .30 +
          random() *
          .68,

        speed:
          direction *
          (
            .11 +
            random() *
            .58
          ),

        size:
          index < 10
            ? .09 +
              random() *
              .18
            : .035 +
              random() *
              .11,

        color:
          COLORS[
            Math.floor(
              random() *
              COLORS.length
            )
          ],

        phase:
          random() *
          Math.PI *
          2,

        tilt: [
          (
            random() -
            .5
          ) * 2.25,

          (
            random() -
            .5
          ) * 2.0,

          (
            random() -
            .5
          ) * 2.7
        ],

        depth:
          .25 +
          random() *
          2.1,

        trace:
          index < 18

      };

    }
  );
}


const ORBITS =
  makeOrbitData();


/* =========================================================
   ORBIT TRACE
========================================================= */

function OrbitTrace({
  radius,
  flatten,
  color
}) {

  const geometry =
    useMemo(() => {

      const points = [];


      for (
        let i = 0;
        i < 260;
        i++
      ) {

        const angle =
          (
            i /
            260
          ) *
          Math.PI *
          2;


        points.push(
          new THREE.Vector3(

            Math.cos(angle) *
            radius,

            Math.sin(angle) *
            radius *
            flatten,

            0

          )
        );

      }


      return new THREE
        .BufferGeometry()
        .setFromPoints(
          points
        );

    }, [
      radius,
      flatten
    ]);


  return (
    <lineLoop
      geometry={
        geometry
      }
    >

      <lineBasicMaterial
        color={color}
        transparent
        opacity={.085}
        depthWrite={false}
        blending={
          THREE.AdditiveBlending
        }
      />

    </lineLoop>
  );
}


/* =========================================================
   ORBITER
========================================================= */

function Orbiter({
  radius,
  flatten,
  speed,
  size,
  color,
  phase,
  tilt,
  depth,
  trace,
  progress,
  texture
}) {

  const ref =
    useRef();


  const angle =
    useRef(
      phase
    );


  useFrame(
    (
      { clock },
      delta
    ) => {

      if (!ref.current) {
        return;
      }


      const finalStop =
        THREE.MathUtils
          .smoothstep(
            progress,
            .83,
            1
          );


      let velocity =
        1;


      if (
        progress >
        .20 &&
        progress <
        .40
      ) {

        velocity =
          2.4;

      }


      if (
        progress >=
        .40 &&
        progress <
        .60
      ) {

        velocity =
          3.7;

      }


      if (
        progress >=
        .60 &&
        progress <
        .82
      ) {

        velocity =
          2.0;

      }


      velocity *=
        1 -
        finalStop *
        .975;


      angle.current +=
        delta *
        speed *
        Math.max(
          .018,
          velocity
        );


      const a =
        angle.current;


      let expansion =
        1;


      if (
        progress >
        .56
      ) {

        expansion =
          1 +
          THREE.MathUtils
            .smoothstep(
              progress,
              .56,
              .78
            ) *
            .32;

      }


      ref.current.position.set(

        Math.cos(a) *
        radius *
        expansion,

        Math.sin(a) *
        radius *
        flatten *
        expansion,

        Math.sin(
          a * 1.43 +
          phase
        ) *
        depth

      );


      const pulse =
        1 +
        Math.sin(
          clock
            .getElapsedTime() *
          1.4 +
          phase
        ) * .13;


      ref.current.scale
        .setScalar(
          pulse
        );

    }
  );


  return (
    <group
      rotation={
        tilt
      }
    >

      {trace && (
        <OrbitTrace
          radius={radius}
          flatten={flatten}
          color={color}
        />
      )}

      <group ref={ref}>

        <sprite
          scale={[
            size * 12,
            size * 12,
            1
          ]}
        >

          <spriteMaterial
            map={texture}
            color={color}
            transparent
            opacity={.46}
            depthWrite={false}
            blending={
              THREE.AdditiveBlending
            }
          />

        </sprite>


        <mesh>

          <sphereGeometry
            args={[
              size,
              20,
              20
            ]}
          />

          <meshBasicMaterial
            color={color}
            toneMapped={false}
          />

        </mesh>

      </group>

    </group>
  );
}


/* =========================================================
   CAMERA
========================================================= */

function CameraRig({
  progress
}) {

  const {
    camera,
    pointer
  } = useThree();


  useFrame(
    ({ clock }) => {

      const t =
        clock.getElapsedTime();


      /*
       距離が変わる
       ここは明確にカメラを前進
      */

      const punch =
        Math.exp(
          -Math.pow(
            (
              progress -
              .48
            ) /
            .075,
            2
          )
        );


      const final =
        THREE.MathUtils
          .smoothstep(
            progress,
            .82,
            1
          );


      const radius =
        11.3 -
        progress *
        1.35 -
        punch *
        2.7 +
        final *
        .9;


      const orbitAngle =
        (
          progress -
          .5
        ) *
        .24 +
        Math.sin(
          t * .085
        ) *
        .065 +
        pointer.x *
        .075;


      const x =
        Math.sin(
          orbitAngle
        ) *
        radius;


      const z =
        Math.cos(
          orbitAngle
        ) *
        radius;


      const y =
        pointer.y *
        .72 +
        Math.sin(
          t * .061
        ) *
        .20;


      camera.position.x =
        THREE.MathUtils.lerp(
          camera.position.x,
          x,
          .038
        );


      camera.position.y =
        THREE.MathUtils.lerp(
          camera.position.y,
          y,
          .038
        );


      camera.position.z =
        THREE.MathUtils.lerp(
          camera.position.z,
          z,
          .038
        );


      camera.lookAt(
        0,
        0,
        0
      );

    }
  );


  return null;
}


/* =========================================================
   BACK WORLD
========================================================= */

function BackWorld({
  progress
}) {

  const system =
    useRef();


  const texture =
    useMemo(
      () =>
        createGlowTexture(),
      []
    );


  useEffect(
    () => {
      return () =>
        texture.dispose();
    },
    [texture]
  );


  useFrame(
    ({ clock }) => {

      if (!system.current) {
        return;
      }


      const t =
        clock.getElapsedTime();


      const final =
        THREE.MathUtils
          .smoothstep(
            progress,
            .82,
            1
          );


      system.current.rotation.y =
        (
          Math.sin(
            t * .07
          ) *
          .14 +
          progress *
          .78
        ) *
        (
          1 -
          final *
          .7
        );


      system.current.rotation.x =
        (
          Math.cos(
            t * .053
          ) *
          .085 +
          progress *
          .19
        ) *
        (
          1 -
          final *
          .7
        );


      system.current.rotation.z =
        Math.sin(
          progress *
          Math.PI *
          2
        ) *
        .095 *
        (
          1 -
          final
        );

    }
  );


  return (
    <>

      <color
        attach="background"
        args={[
          '#000005'
        ]}
      />


      <fog
        attach="fog"
        args={[
          '#000005',
          15,
          58
        ]}
      />


      <DeepStars />


      <GalaxyBelt
        progress={
          progress
        }
      />


      <group
        ref={
          system
        }
      >

        {ORBITS.map(
          (
            orbit,
            index
          ) => (

            <Orbiter
              key={index}
              {...orbit}
              progress={
                progress
              }
              texture={
                texture
              }
            />

          )
        )}

      </group>


      <CameraRig
        progress={
          progress
        }
      />


      <EffectComposer
        multisampling={0}
      >

        <Bloom
          mipmapBlur
          intensity={1.8}
          luminanceThreshold={.10}
          luminanceSmoothing={.82}
        />

        <Vignette
          eskil={false}
          offset={.12}
          darkness={.72}
        />

      </EffectComposer>

    </>
  );
}


/* =========================================================
   FOREGROUND TRAVELLERS
   本当に文字より手前に描画
========================================================= */

function ForegroundTraveller({
  phase,
  speed,
  y,
  size,
  color,
  texture,
  progress
}) {

  const ref =
    useRef();


  useFrame(
    ({ clock }) => {

      if (!ref.current) {
        return;
      }


      /*
       4章で手前の天体が増える
      */

      const enter =
        THREE.MathUtils
          .smoothstep(
            progress,
            .54,
            .68
          );


      const t =
        (
          clock
            .getElapsedTime() *
          speed +
          phase
        ) % 1;


      const x =
        THREE.MathUtils
          .lerp(
            -10,
            10,
            t
          );


      const wave =
        Math.sin(
          t *
          Math.PI *
          2 +
          phase *
          6
        );


      ref.current.position.set(

        x,

        y +
        wave * 1.25,

        0

      );


      const middle =
        1 -
        Math.abs(
          t -
          .5
        ) *
        2;


      const scale =
        (
          .70 +
          middle *
          3.7
        ) *
        (
          .25 +
          enter *
          .75
        );


      ref.current.scale
        .setScalar(
          scale
        );

    }
  );


  return (
    <group ref={ref}>

      <sprite
        scale={[
          size * 10,
          size * 10,
          1
        ]}
      >

        <spriteMaterial
          map={texture}
          color={color}
          transparent
          opacity={.62}
          depthWrite={false}
          blending={
            THREE.AdditiveBlending
          }
        />

      </sprite>


      <mesh>

        <sphereGeometry
          args={[
            size,
            20,
            20
          ]}
        />

        <meshBasicMaterial
          color={color}
          toneMapped={false}
        />

      </mesh>

    </group>
  );
}


function FrontWorld({
  progress
}) {

  const texture =
    useMemo(
      () =>
        createGlowTexture(),
      []
    );


  return (
    <>

      <ForegroundTraveller
        phase={.05}
        speed={.038}
        y={-1.8}
        size={.22}
        color="#80d8ff"
        texture={texture}
        progress={progress}
      />


      <ForegroundTraveller
        phase={.22}
        speed={.027}
        y={1.1}
        size={.30}
        color="#ff9dc9"
        texture={texture}
        progress={progress}
      />


      <ForegroundTraveller
        phase={.41}
        speed={.046}
        y={-.2}
        size={.16}
        color="#ffffff"
        texture={texture}
        progress={progress}
      />


      <ForegroundTraveller
        phase={.61}
        speed={.023}
        y={2.0}
        size={.25}
        color="#d3b5ff"
        texture={texture}
        progress={progress}
      />


      <ForegroundTraveller
        phase={.81}
        speed={.032}
        y={-2.6}
        size={.20}
        color="#ffe3a7"
        texture={texture}
        progress={progress}
      />

    </>
  );
}


/* =========================================================
   EXPERIENCE
========================================================= */

export default function OrbitExperience() {

  const shell =
    useRef();


  const frame =
    useRef(null);


  const [
    progress,
    setProgress
  ] =
    useState(0);


  const [
    active,
    setActive
  ] =
    useState(0);


  useEffect(() => {

    const update =
      () => {

        frame.current =
          null;


        if (!shell.current) {
          return;
        }


        const rect =
          shell.current
            .getBoundingClientRect();


        const total =
          shell.current
            .offsetHeight -
          window.innerHeight;


        const passed =
          Math.min(
            total,
            Math.max(
              0,
              -rect.top
            )
          );


        const next =
          total > 0
            ? passed /
              total
            : 0;


        setProgress(
          next
        );


        let chapter = 0;


        if (
          next >= .82
        ) {

          chapter = 4;

        } else if (
          next >= .60
        ) {

          chapter = 3;

        } else if (
          next >= .40
        ) {

          chapter = 2;

        } else if (
          next >= .20
        ) {

          chapter = 1;

        }


        setActive(
          chapter
        );

      };


    const schedule =
      () => {

        if (
          frame.current !==
          null
        ) {
          return;
        }


        frame.current =
          requestAnimationFrame(
            update
          );

      };


    update();


    window.addEventListener(
      'scroll',
      schedule,
      {
        passive: true
      }
    );


    window.addEventListener(
      'resize',
      schedule
    );


    return () => {

      window.removeEventListener(
        'scroll',
        schedule
      );


      window.removeEventListener(
        'resize',
        schedule
      );


      if (
        frame.current !==
        null
      ) {

        cancelAnimationFrame(
          frame.current
        );

      }

    };

  }, []);


  const final =
    active === 4;


  return (
    <main
      ref={shell}
      className="orbit-shell"
      data-chapter={
        active
      }
      data-final={
        final
          ? 'true'
          : 'false'
      }
    >

      <div
        className="orbit-stage"
      >


        {/* BACK 3D */}

        <div
          className="orbit-layer orbit-layer--back"
        >

          <Canvas
            dpr={[1, 1.55]}
            camera={{
              position: [
                0,
                0,
                11.3
              ],
              fov: 51,
              near: .1,
              far: 100
            }}
            gl={{
              antialias: false,
              alpha: false,
              powerPreference:
                'high-performance'
            }}
            onCreated={({
              gl
            }) => {

              gl.toneMapping =
                THREE.ACESFilmicToneMapping;


              gl.toneMappingExposure =
                1.08;

            }}
          >

            <BackWorld
              progress={
                progress
              }
            />

          </Canvas>

        </div>


        {/* SHARP DOM TEXT */}

        <section
          className="orbit-copy"
        >

          <div
            className="orbit-copy-inner"
          >

            <span
              className="orbit-chapter-name"
            >
              {
                CHAPTERS[
                  active
                ].key
              }
            </span>


            <div
              key={active}
              className={
                final
                  ? 'orbit-text orbit-text--final'
                  : 'orbit-text'
              }
            >

              {
                CHAPTERS[
                  active
                ].text
              }

            </div>

          </div>

        </section>


        {/* FRONT 3D */}

        <div
          className="orbit-layer orbit-layer--front"
        >

          <Canvas
            dpr={[1, 1.35]}
            camera={{
              position: [
                0,
                0,
                9
              ],
              fov: 50,
              near: .1,
              far: 30
            }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference:
                'high-performance'
            }}
            onCreated={({
              gl
            }) => {

              gl.setClearColor(
                0x000000,
                0
              );

            }}
          >

            <FrontWorld
              progress={
                progress
              }
            />

          </Canvas>

        </div>


        <div
          className="orbit-vignette"
        />


        <header
          className="orbit-meta"
        >

          <span>
            stilloperable
          </span>

          <span>
            ORBIT
            {' '}
            {String(
              active + 1
            ).padStart(
              2,
              '0'
            )}
            /05
          </span>

        </header>


        <footer
          className="orbit-footer"
        >

          <span
            className="orbit-scroll"
          >

            {final
              ? ''
              : 'SCROLL'}

          </span>


          <div
            className="orbit-progress"
          >

            <span
              style={{
                width:
                  `${
                    progress *
                    100
                  }%`
              }}
            />

          </div>

        </footer>

      </div>

    </main>
  );
}
