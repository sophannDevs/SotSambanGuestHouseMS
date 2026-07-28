"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/header";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CalendarRoom {
  id: string;
  number: string;
  type: string;
  floor: number;
}

interface CalendarReservation {
  id: string;
  rsvNumber: string;
  guestName: string;
  roomId: string;
  startDay: number; // 0 to 6 index for week
  lengthDays: number;
  status: "CHECKED_IN" | "CONFIRMED" | "BLOCKED";
}

const ROOMS: CalendarRoom[] = [
  { id: "101", number: "101", type: "Single", floor: 1 },
  { id: "102", number: "102", type: "Double", floor: 1 },
  { id: "103", number: "103", type: "Double", floor: 1 },
  { id: "104", number: "104", type: "Twin", floor: 1 },
  { id: "105", number: "105", type: "Deluxe", floor: 1 },
  { id: "201", number: "201", type: "Double", floor: 2 },
  { id: "202", number: "202", type: "Family", floor: 2 },
];

const DATES = [
  { day: "Mon", date: "Jul 27" },
  { day: "Tue", date: "Jul 28" },
  { day: "Wed", date: "Jul 29" },
  { day: "Thu", date: "Jul 30" },
  { day: "Fri", date: "Jul 31" },
  { day: "Sat", date: "Aug 01" },
  { day: "Sun", date: "Aug 02" },
];

const BARS: CalendarReservation[] = [
  { id: "1", rsvNumber: "RSV-2026-000001", guestName: "John Smith", roomId: "102", startDay: 0, lengthDays: 2, status: "CHECKED_IN" },
  { id: "2", rsvNumber: "RSV-2026-000002", guestName: "Emma Watson", roomId: "104", startDay: 1, lengthDays: 3, status: "CONFIRMED" },
  { id: "3", rsvNumber: "BLK-105", guestName: "Renovation Block", roomId: "105", startDay: 1, lengthDays: 4, status: "BLOCKED" },
];

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const tStatus = useTranslations("enum.status");

  const getBarStyle = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "bg-emerald-600 text-white shadow-emerald-900/30";
      case "CONFIRMED":
        return "bg-blue-600 text-white shadow-blue-900/30";
      case "BLOCKED":
        return "bg-slate-700 text-slate-200 border border-slate-600 pattern-hatched";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actionLabel={t("newBooking")}
        actionIcon={Plus}
        onAction={() => toast.info(t("toastNewBooking"))}
      />

      {/* Calendar Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-xl border border-border/60">
            {t("today")}
          </button>
          <div className="flex items-center border border-border/60 rounded-xl overflow-hidden">
            <button className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-foreground">Jul 27 – Aug 02, 2026</span>
            <button className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Color Legend (FR-127) */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-600" />
            <span>{tStatus("CHECKED_IN")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            <span>{tStatus("CONFIRMED")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-700 border border-slate-500" />
            <span>{tStatus("BLOCKED")}</span>
          </div>
        </div>
      </div>

      {/* Timeline Grid (FR-118) */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Dates Header */}
          <div className="grid grid-cols-8 border-b border-border/40 pb-3">
            <div className="text-xs font-bold uppercase text-muted-foreground">{t("roomColumn")}</div>
            {DATES.map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-semibold text-muted-foreground">{d.day}</p>
                <p className="text-xs font-bold text-foreground">{d.date}</p>
              </div>
            ))}
          </div>

          {/* Room Timeline Rows */}
          <div className="divide-y divide-border/30">
            {ROOMS.map((room) => {
              const roomBars = BARS.filter((b) => b.roomId === room.id);
              return (
                <div key={room.id} className="grid grid-cols-8 py-3 items-center relative min-h-[56px] hover:bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">#{room.number}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">({room.type})</span>
                  </div>

                  {/* 7 Date Columns Area */}
                  <div className="col-span-7 grid grid-cols-7 relative h-10 items-center">
                    {/* Empty cell background lines */}
                    {DATES.map((_, idx) => (
                      <div key={idx} className="border-r border-border/20 h-full" />
                    ))}

                    {/* Reservation Bars overlay */}
                    {roomBars.map((bar) => {
                      const leftPercent = (bar.startDay / 7) * 100;
                      const widthPercent = (bar.lengthDays / 7) * 100;
                      return (
                        <Link
                          key={bar.id}
                          href={bar.status === "BLOCKED" ? "#" : `/reservations/1`}
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                          className={`absolute h-8 rounded-xl px-2.5 flex items-center justify-between text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02] ${getBarStyle(
                            bar.status
                          )}`}
                        >
                          <span className="truncate">{bar.guestName}</span>
                          <span className="text-[10px] opacity-80 font-mono ml-1">{bar.rsvNumber}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
