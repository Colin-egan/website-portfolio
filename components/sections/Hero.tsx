"use client";

import { useRef, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Environment } from "@react-three/drei";
import * as THREE from "three";
import { ArrowRight, Sparkles } from "lucide-react";

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse, viewport } = useThree();
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.2;
    meshRef.current.rotation.y = time * 0.3;
    // Subtle mouse tracking
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      (mouse.x * viewport.width) / 4,
      0.05
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      (mouse.y * viewport.height) / 4,
      0.05
    );
  });

  return (
    <Sphere ref={meshRef} args={[1.4, 100, 100]}>
      <MeshDistortMaterial
        color="#7C3AED"
        attach="material"
        distort={0.45}
        speed={2.5}
        roughness={0}
        metalness={0.8}
        envMapIntensity={1.2}
      />
    </Sphere>
  );
}

function FloatingOrbs() {
  const orb1 = useRef<THREE.Mesh>(null);
  const orb2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (orb1.current) {
      orb1.current.position.x = Math.sin(t * 0.5) * 2.5;
      orb1.current.position.y = Math.cos(t * 0.4) * 1.5 + 1;
    }
    if (orb2.current) {
      orb2.current.position.x = Math.cos(t * 0.3) * 3 - 1;
      orb2.current.position.y = Math.sin(t * 0.6) * 1 - 1;
    }
  });

  return (
    <>
      <mesh ref={orb1}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#A78BFA" transparent opacity={0.6} />
      </mesh>
      <mesh ref={orb2}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#7C3AED" transparent opacity={0.4} />
      </mesh>
    </>
  );
}

const words = ["Build websites", "that", "win clients."];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden gradient-mesh noise">
      {/* 3D Canvas */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
            <pointLight position={[-5, -5, 5]} intensity={0.8} color="#7C3AED" />
            <pointLight position={[5, -5, -5]} intensity={0.5} color="#A78BFA" />
            <AnimatedSphere />
            <FloatingOrbs />
            <Environment files="/CH.jpeg" />
          </Suspense>
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles size={14} />
            AI-powered web design & automation
          </motion.div>

          {/* Headline — word by word reveal */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-8xl xl:text-9xl leading-[0.9] tracking-tight mb-8 overflow-hidden">
            {["Build websites", "that"].map((line, lineIdx) => (
              <div key={lineIdx} className="overflow-hidden">
                <motion.div
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.4 + lineIdx * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {line}
                </motion.div>
              </div>
            ))}
            <div className="overflow-hidden">
              <motion.div
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-gradient"
              >
                win clients.
              </motion.div>
            </div>
          </h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            AI tools managed by human intelligence.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/pricing"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              View Pricing
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-foreground/15 hover:border-purple-500/50 hover:bg-purple-500/10 font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Book a Call
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform opacity-60" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap gap-8 mt-16 pt-16 border-t border-foreground/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            {[
              { value: "50+", label: "Projects Delivered", teal: false },
              { value: "98%", label: "Client Satisfaction", teal: true },
              { value: "3×", label: "Avg. Revenue Increase", teal: false },
              { value: "48h", label: "First Draft", teal: true },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-4xl font-display font-bold"
                  style={stat.teal
                    ? { color: "oklch(0.75 0.15 195)" }
                    : undefined}
                >
                  {stat.teal ? stat.value : <span className="text-gradient">{stat.value}</span>}
                </div>
                <div className="text-base text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
      >
        <span className="text-xs text-muted-foreground tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-purple-400 to-transparent"
          animate={{ scaleY: [1, 0.3, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
