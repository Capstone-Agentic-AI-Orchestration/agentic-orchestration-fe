"use client";

import React, { useEffect, useRef } from "react";
import "./DitheredWaves.css";

interface WaveLayer {
  amplitude: number;
  frequency: number;
  speed: number;
  offsetY: number;
  fillColor: string;
  strokeColor: string;
}

export function DitheredWaves() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Responsive sizing with Device Pixel Ratio for crisp rendering
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Mouse listeners for interactive wave bending
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Sleek retro black & white / grayscale layers following the technical theme
    const layers: WaveLayer[] = [
      {
        amplitude: 35,
        frequency: 0.003,
        speed: 0.015,
        offsetY: 0.65,
        fillColor: "rgba(250, 250, 250, 0.012)",
        strokeColor: "rgba(250, 250, 250, 0.06)",
      },
      {
        amplitude: 45,
        frequency: 0.002,
        speed: -0.012,
        offsetY: 0.70,
        fillColor: "rgba(250, 250, 250, 0.02)",
        strokeColor: "rgba(250, 250, 250, 0.10)",
      },
      {
        amplitude: 25,
        frequency: 0.005,
        speed: 0.022,
        offsetY: 0.73,
        fillColor: "rgba(250, 250, 250, 0.03)",
        strokeColor: "rgba(250, 250, 250, 0.14)",
      },
      {
        amplitude: 55,
        frequency: 0.0015,
        speed: 0.008,
        offsetY: 0.76,
        fillColor: "rgba(250, 250, 250, 0.04)",
        strokeColor: "rgba(250, 250, 250, 0.18)",
      },
      {
        amplitude: 15,
        frequency: 0.008,
        speed: -0.028,
        offsetY: 0.82,
        fillColor: "rgba(250, 250, 250, 0.05)",
        strokeColor: "rgba(250, 250, 250, 0.22)",
      },
    ];

    // Animation Loop
    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      // Smooth interpolation (lerp) for cursor position to make interaction feel fluid & elastic
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      } else {
        // Return to center slowly if inactive
        mouse.targetX = w / 2;
        mouse.targetY = h * 0.7;
        mouse.x += (mouse.targetX - mouse.x) * 0.03;
        mouse.y += (mouse.targetY - mouse.y) * 0.03;
      }

      time += 0.5;

      // Draw each wave layer
      layers.forEach((layer) => {
        ctx.beginPath();
        
        // Retro pixelation step: evaluate wave at discrete x coordinates for slightly digital curves
        const step = 6;
        
        ctx.moveTo(0, h);

        for (let x = 0; x <= w; x += step) {
          // Calculate baseline sinusoidal displacement
          let waveY = Math.sin(x * layer.frequency + time * layer.speed) * layer.amplitude;
          waveY += Math.cos(x * (layer.frequency * 0.5) - time * (layer.speed * 0.8)) * (layer.amplitude * 0.5);

          // Add interactive mouse warp
          const dx = x - mouse.x;
          const dist = Math.abs(dx);
          const maxInfluenceDist = w * 0.35; // Warp covers 35% of screen width

          if (dist < maxInfluenceDist) {
            // Factor decays exponentially from cursor center
            const influence = Math.pow(1 - dist / maxInfluenceDist, 2.5);
            // Warp vertical position towards mouse Y coordinate relative to layer default
            const targetYOffset = mouse.y - (h * layer.offsetY);
            waveY += targetYOffset * influence * 0.65;
          }

          const y = h * layer.offsetY + waveY;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();

        ctx.fillStyle = layer.fillColor;
        ctx.fill();
        
        // Optional subtle outline for synthwave wireframe definition
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="dithered-waves-container">
      <canvas ref={canvasRef} className="dithered-waves-canvas" />
      <div className="dither-overlay" />
      <div className="retro-glow-bottom" />
    </div>
  );
}
