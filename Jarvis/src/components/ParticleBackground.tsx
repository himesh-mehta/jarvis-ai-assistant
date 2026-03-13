"use client";

import React, { useEffect, useRef, useState } from 'react';

class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        const colors = ['#00d2ff', '#9d50bb', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > this.canvas.width) this.x = 0;
        else if (this.x < 0) this.x = this.canvas.width;
        if (this.y > this.canvas.height) this.y = 0;
        else if (this.y < 0) this.y = this.canvas.height;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.globalAlpha = 0.4;
        this.ctx.fill();
        
        // Add a small glow to some particles
        if (Math.random() > 0.95) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.color;
        } else {
            this.ctx.shadowBlur = 0;
        }
    }
}

interface ParticleBackgroundProps {
    reducedDensity?: boolean;
}

const ParticleBackground = ({ reducedDensity = false }: ParticleBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init(); // Re-init on resize to update count
        };

        const init = () => {
            particles = [];
            let particleCount = Math.floor((window.innerWidth * window.innerHeight) / 10000);
            if (reducedDensity) {
                particleCount = Math.floor(particleCount * 0.15); // 85% reduction
            }
            for (let i = 0; i < Math.max(reducedDensity ? 15 : 100, particleCount); i++) {
                particles.push(new Particle(canvas, ctx));
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                // Drastically lower alpha in reduced mode
                const originalAlpha = 0.4;
                ctx.globalAlpha = reducedDensity ? originalAlpha * 0.25 : originalAlpha;
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [reducedDensity]);

    if (!mounted) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
};

export default ParticleBackground;
