"use client";

import { useEffect, useState } from "react";

type Duration = { years: number; months: number; days: number; hours: number; minutes: number; seconds: number };
const START_MS = new Date("2026-02-11T21:35:00+03:00").getTime();

function calendarDiff(startMs: number, endMs: number): Duration {
  if (endMs <= startMs) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const partsAtIstanbul = (instant: number) => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
  };
  const s = partsAtIstanbul(startMs); const e = partsAtIstanbul(endMs);
  // Ay dönümü, başlangıç gününün Türkiye takvimindeki 00.00 anında gelir.
  // Böylece 11 Ekim 00.00'da ay sayısı 8 olur; 21.35'i beklemez.
  const elapsedMonths = Math.max(
    0,
    (e.year - s.year) * 12 + (e.month - s.month) - (e.day < s.day ? 1 : 0)
  );
  const years = Math.floor(elapsedMonths / 12);
  const months = elapsedMonths % 12;

  let remainingMs: number;
  if (elapsedMonths === 0) {
    remainingMs = endMs - startMs;
  } else {
    const anchorMonthIndex = s.year * 12 + (s.month - 1) + elapsedMonths;
    const anchorYear = Math.floor(anchorMonthIndex / 12);
    const anchorMonth = (anchorMonthIndex % 12) + 1;
    const endCalendarMs = Date.UTC(e.year, e.month - 1, e.day, e.hour, e.minute, e.second);
    const anchorMidnightMs = Date.UTC(anchorYear, anchorMonth - 1, s.day);
    remainingMs = Math.max(0, endCalendarMs - anchorMidnightMs);
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return { years, months, days, hours, minutes, seconds };
}

export function BizCounter() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null) return <p className="counter-loading" role="status">Birlikte geçen süre hazırlanıyor…</p>;
  if (now < START_MS) return <p className="counter-loading">Sayaç 11 Şubat 2026, 21:35’te başlayacak.</p>;
  const duration = calendarDiff(START_MS, now);
  const items: [string, number][] = [["Yıl", duration.years], ["Ay", duration.months], ["Gün", duration.days], ["Saat", duration.hours], ["Dakika", duration.minutes], ["Saniye", duration.seconds]];
  return <div className="counter-units" aria-label={`Birlikte geçen süre: ${items.map(([label, value]) => `${value} ${label.toLocaleLowerCase("tr-TR")}`).join(", ")}`}>
    {items.map(([label, value]) => <div className="counter-unit" key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
  </div>;
}
