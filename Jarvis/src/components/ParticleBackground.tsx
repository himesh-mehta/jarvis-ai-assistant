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

    update(mouse: { x: number; y: number }) {
        // Interaction with mouse
        if (mouse.x !== 0 && mouse.y !== 0) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If mouse is close, push particles away slightly
            if (distance < 120) {
                const forceX = dx / distance;
                const forceY = dy / distance;
                this.x -= forceX * 0.5;
                this.y -= forceY * 0.5;
            }
        }

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
        this.ctx.fill();
        
        // Add a small glow to some particles
        if (Math.random() > 0.95) {
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = this.color;
        } else {
            this.ctx.shadowBlur = 0;
        }
    }
}

interface ParticleBackgroundProps {
    reducedDensity?: boolean;
    intensity?: number;
}

const ParticleBackground = ({ reducedDensity = false, intensity = 1 }: ParticleBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);
    const mouse = useRef({ x: 0, y: 0 });

    // Set mounted on client
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init(); 
        };

        const init = () => {
            particles = [];
            let particleCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
            if (reducedDensity) {
                particleCount = Math.floor(particleCount * 0.15);
            }
            particleCount = Math.floor(particleCount * intensity);

            const minParticles = reducedDensity ? 10 : Math.floor(70 * intensity); 
            for (let i = 0; i < Math.max(minParticles, particleCount); i++) {
                particles.push(new Particle(canvas, ctx));
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update(mouse.current);
                const originalAlpha = 0.3;
                ctx.globalAlpha = (reducedDensity ? originalAlpha * 0.25 : originalAlpha) * intensity;
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        
        resize();
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [mounted, reducedDensity, intensity]);

    if (!mounted) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ background: 'transparent' }}
        />
    );
};

export default ParticleBackground;
