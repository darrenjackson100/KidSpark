import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLOURS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#fbbf24", "#14b8a6", "#ef4444"];
const SHAPES = ["circle", "square", "triangle"];

interface Piece {
  id: number;
  x: number;
  color: string;
  shape: string;
  delay: number;
  size: number;
  rotation: number;
}

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    const newPieces: Piece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      delay: Math.random() * 0.6,
      size: 8 + Math.random() * 12,
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ top: "-5%", left: `${p.x}%`, rotate: p.rotation, opacity: 1, scale: 1 }}
          animate={{
            top: "110%",
            rotate: p.rotation + 360 + Math.random() * 360,
            opacity: [1, 1, 0],
            x: (Math.random() - 0.5) * 120,
          }}
          transition={{ duration: 1.5 + Math.random() * 1.5, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "fixed",
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== "triangle" ? p.color : "transparent",
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "3px" : 0,
            borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
            borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
            borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : undefined,
          }}
        />
      ))}
    </div>
  );
}
