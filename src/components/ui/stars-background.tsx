"use client";
import { cn } from "@/lib/utils";
import React, {
  useState,
  useEffect,
  useRef,
  RefObject,
  useCallback,
} from "react";
import gsap from "gsap";

interface StarProps {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number | null;
  initialX: number;
  initialY: number;
  parallaxFactor: number;
  currentX: number;
  currentY: number;
}

interface StarBackgroundProps {
  starDensity?: number;
  allStarsTwinkle?: boolean;
  twinkleProbability?: number;
  minTwinkleSpeed?: number;
  maxTwinkleSpeed?: number;
  className?: string;
  parallaxStrength?: number;
}

export const StarsBackground: React.FC<StarBackgroundProps> = ({
  starDensity = 0.00015,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
  className,
  parallaxStrength = 2,
}) => {
  const [stars, setStars] = useState<StarProps[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef: RefObject<HTMLCanvasElement> =
    useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<StarProps[]>([]);

  const generateStars = useCallback(
    (width: number, height: number): StarProps[] => {
      const area = width * height;
      const numStars = Math.floor(area * starDensity);
      return Array.from({ length: numStars }, () => {
        const shouldTwinkle =
          allStarsTwinkle || Math.random() < twinkleProbability;
        const x = Math.random() * width;
        const y = Math.random() * height;
        return {
          x,
          y,
          initialX: x,
          initialY: y,
          currentX: x,
          currentY: y,
          radius: Math.random() * 0.05 + 0.5,
          opacity: Math.random() * 0.5 + 0.5,
          twinkleSpeed: shouldTwinkle
            ? minTwinkleSpeed +
              Math.random() * (maxTwinkleSpeed - minTwinkleSpeed)
            : null,
          parallaxFactor: Math.random() * 0.5 + 0.5,
        };
      });
    },
    [
      starDensity,
      allStarsTwinkle,
      twinkleProbability,
      minTwinkleSpeed,
      maxTwinkleSpeed,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        // Update each star's position with GSAP
        starsRef.current.forEach((star, index) => {
          const offsetX = x * parallaxStrength * star.parallaxFactor * 100;
          const offsetY = y * parallaxStrength * star.parallaxFactor * 100;

          gsap.to(star, {
            currentX: star.initialX + offsetX,
            currentY: star.initialY + offsetY,
            duration: 1,
            ease: "power2.out",
          });
        });

        setMousePosition({ x, y });
      }
    },
    [parallaxStrength]
  );

  useEffect(() => {
    const updateStars = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        const newStars = generateStars(width, height);
        setStars(newStars);
        starsRef.current = newStars;
      }
    };

    updateStars();
    window.addEventListener("mousemove", handleMouseMove);

    const resizeObserver = new ResizeObserver(updateStars);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (canvasRef.current) {
        resizeObserver.unobserve(canvasRef.current);
      }
    };
  }, [generateStars, handleMouseMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      starsRef.current.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.currentX, star.currentY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        if (star.twinkleSpeed !== null) {
          star.opacity =
            0.5 +
            Math.abs(Math.sin((Date.now() * 0.001) / star.twinkleSpeed) * 0.5);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full absolute inset-0 -z-20", className)}
    />
  );
};
