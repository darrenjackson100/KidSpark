import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

interface ClockTime { hour: number; minute: number; display: string }

function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 80, cy = 80, r = 72;
  const hDeg = ((hour % 12) + minute / 60) * 30 - 90;
  const mDeg = minute * 6 - 90;
  const end = (deg: number, len: number) => ({
    x: cx + len * Math.cos(toRad(deg)),
    y: cy + len * Math.sin(toRad(deg)),
  });
  const hEnd = end(hDeg, 42);
  const mEnd = end(mDeg, 58);
  const hourNums = [12,1,2,3,4,5,6,7,8,9,10,11];
  return (
    <svg viewBox="0 0 160 160" width={200} height={200} className="drop-shadow-xl">
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#e2e8f0" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="#cbd5e1" strokeWidth={1} />
      {Array.from({ length: 60 }).map((_, t) => {
        const a = t * 6 - 90;
        const isHour = t % 5 === 0;
        const outer = end(a, isHour ? r - 5 : r - 9);
        const inner = end(a, isHour ? r - 16 : r - 13);
        return <line key={t} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={isHour ? "#334155" : "#94a3b8"} strokeWidth={isHour ? 2.5 : 1} />;
      })}
      {hourNums.map((n, i) => {
        const a = i * 30 - 90;
        const pos = end(a, r - 26);
        return <text key={n} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold" fill="#1e293b">{n}</text>;
      })}
      <line x1={cx} y1={cy} x2={hEnd.x} y2={hEnd.y} stroke="#1e293b" strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mEnd.x} y2={mEnd.y} stroke="#334155" strokeWidth={4} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={end(mDeg, -12).x} y2={end(mDeg, -12).y} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={end(mDeg, 66).x} y2={end(mDeg, 66).y} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#ef4444" />
      <circle cx={cx} cy={cy} r={2} fill="white" />
    </svg>
  );
}

const TIMES: ClockTime[] = [
  { hour: 1, minute: 0,  display: "1:00" },
  { hour: 2, minute: 0,  display: "2:00" },
  { hour: 3, minute: 0,  display: "3:00" },
  { hour: 4, minute: 0,  display: "4:00" },
  { hour: 5, minute: 0,  display: "5:00" },
  { hour: 6, minute: 0,  display: "6:00" },
  { hour: 7, minute: 0,  display: "7:00" },
  { hour: 8, minute: 0,  display: "8:00" },
  { hour: 9, minute: 0,  display: "9:00" },
  { hour: 10, minute: 0, display: "10:00" },
  { hour: 11, minute: 0, display: "11:00" },
  { hour: 12, minute: 0, display: "12:00" },
  { hour: 3, minute: 30, display: "3:30" },
  { hour: 6, minute: 30, display: "6:30" },
  { hour: 9, minute: 30, display: "9:30" },
  { hour: 12, minute: 30,display: "12:30" },
  { hour: 1, minute: 15, display: "1:15" },
  { hour: 4, minute: 15, display: "4:15" },
  { hour: 7, minute: 15, display: "7:15" },
  { hour: 10, minute: 45,display: "10:45" },
  { hour: 2, minute: 45, display: "2:45" },
  { hour: 5, minute: 45, display: "5:45" },
];

function nearTimes(t: ClockTime, all: ClockTime[]): ClockTime[] {
  return shuffle(all.filter(x => x.display !== t.display)).slice(0, 3);
}

export default function TimeTelling() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(TIMES).slice(0, 10).map((t, i) => {
      const wrong = nearTimes(t, TIMES);
      return {
        id: `q${i}`,
        questionText: `What time does the clock show?`,
        explanation: `The short (hour) hand points to ${t.hour} and the long (minute) hand points to ${t.minute === 0 ? "12" : t.minute === 30 ? "6" : t.minute === 15 ? "3" : "9"}. So the time is ${t.display}.`,
        prompt: (
          <div className="flex flex-col items-center gap-4">
            <ClockFace hour={t.hour} minute={t.minute} />
            <p className="text-2xl font-black text-muted-foreground">What time is it?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: t.display,        labelText: t.display,        isCorrect: true,  color: "bg-green-500" },
          ...wrong.map((w, j) => ({ id: `w${j}`, label: w.display, labelText: w.display, isCorrect: false, color: ["bg-blue-500","bg-orange-500","bg-purple-500"][j] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine gameId="time-telling" gameName="Time Telling" category="health"
      description="Can you read the clock?"
      questions={questions} onExit={() => setLocation("/health")} />
  );
}
