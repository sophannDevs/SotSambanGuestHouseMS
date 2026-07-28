"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { RoomDto, RoomBlockDto, ReservationDto } from "@/lib/api-types";
import { Filter, Lock, Sparkles, CheckCircle2, AlertCircle, BedDouble } from "lucide-react";
import { toast } from "sonner";
import { RoomBlockDialog } from "@/components/rooms/room-block-dialog";

const HK_OPTIONS = ["CLEAN", "DIRTY", "CLEANING", "INSPECTED"] as const;

export default function RoomBoardPage() {
  const t = useTranslations("roomsBoard");
  const tStatus = useTranslations("enum.status");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const canView = hasHydrated && hasPermission("room:view");
  const canChangeStatus = hasHydrated && hasPermission("room:change_status");
  const canBlock = hasHydrated && hasPermission("room:edit");

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    // Polling, not a websocket — matches the "Room status board reflects a
    // real status change made elsewhere within one refresh" acceptance
    // criteria without inventing real-time infra the backend doesn't have.
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: canView,
    refetchInterval: 15_000,
  });
  const inHouseQuery = useQuery({
    queryKey: ["front-desk", "in-house"],
    queryFn: () => apiFetch<ReservationDto[]>("/front-desk/in-house"),
    enabled: canView,
  });

  const [selectedFloor, setSelectedFloor] = React.useState<number | "ALL">("ALL");
  const [blockDialogOpen, setBlockDialogOpen] = React.useState(false);
  const [blockRoomId, setBlockRoomId] = React.useState<string | undefined>();

  const rooms = roomsQuery.data ?? [];
  const guestByRoomId = new Map((inHouseQuery.data ?? []).filter((r) => r.assignedRoomId).map((r) => [r.assignedRoomId as string, `${r.mainGuest.firstName} ${r.mainGuest.lastName}`]));
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const totalCount = rooms.length;
  const availableCount = rooms.filter((r) => r.operationalStatus === "AVAILABLE" && r.housekeepingStatus === "CLEAN").length;
  const occupiedCount = rooms.filter((r) => r.operationalStatus === "OCCUPIED").length;
  const dirtyCount = rooms.filter((r) => r.housekeepingStatus === "DIRTY").length;
  const blockedCount = rooms.filter((r) => r.operationalStatus === "BLOCKED" || r.operationalStatus === "UNDER_MAINTENANCE").length;

  const filteredRooms = rooms.filter((r) => (selectedFloor === "ALL" ? true : r.floor === selectedFloor));

  const hkMutation = useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: string }) =>
      apiFetch<RoomDto>(`/rooms/${roomId}/housekeeping-status?status=${encodeURIComponent(status)}`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("toast.housekeepingUpdated"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const blockMutation = useMutation({
    mutationFn: (values: RoomBlockDto) => apiFetch<RoomBlockDto>("/rooms/blocks", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("toast.roomBlocked"));
      setBlockDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const getStatusLabel = (derivedStatus: string) => {
    if (derivedStatus === "OCCUPIED_DIRTY") return t("boardStatus.occupiedDirty");
    return tStatus.has(derivedStatus) ? tStatus(derivedStatus) : derivedStatus.replace("_", " ");
  };

  const getBadgeStyle = (derivedStatus: string) => {
    switch (derivedStatus) {
      case "CLEAN":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "DIRTY":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "CLEANING":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "INSPECTED":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "OCCUPIED":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "OCCUPIED_DIRTY":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "RESERVED":
        return "bg-sky-500/10 text-sky-500 border-sky-500/20";
      case "BLOCKED":
      case "UNDER_MAINTENANCE":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default:
        return "bg-muted text-muted-foreground border-border/40";
    }
  };

  if (!hasHydrated || roomsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageSkeleton />
      </div>
    );
  }

  if (roomsQuery.isError) {
    return <ErrorState title={t("loadError")} onRetry={() => roomsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actionLabel={canBlock ? t("actions.blockRoom") : undefined}
        actionIcon={Lock}
        onAction={() => {
          setBlockRoomId(undefined);
          setBlockDialogOpen(true);
        }}
      />

      {/* Status Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("summary.totalRooms")}</p>
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          </div>
          <BedDouble className="h-6 w-6 text-muted-foreground opacity-60" />
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-500 uppercase">{tStatus("AVAILABLE")}</p>
            <p className="text-2xl font-bold text-emerald-500">{availableCount}</p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-60" />
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase">{tStatus("OCCUPIED")}</p>
            <p className="text-2xl font-bold text-indigo-500">{occupiedCount}</p>
          </div>
          <Sparkles className="h-6 w-6 text-indigo-500 opacity-60" />
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase">{tStatus("DIRTY")}</p>
            <p className="text-2xl font-bold text-amber-500">{dirtyCount}</p>
          </div>
          <AlertCircle className="h-6 w-6 text-amber-500 opacity-60" />
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">{tStatus("BLOCKED")}</p>
            <p className="text-2xl font-bold text-slate-400">{blockedCount}</p>
          </div>
          <Lock className="h-6 w-6 text-slate-400 opacity-60" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground ml-2" />
          <span className="text-xs font-semibold uppercase text-muted-foreground">{t("filters.floorLabel")}</span>
          <button
            onClick={() => setSelectedFloor("ALL")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedFloor === "ALL" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 hover:bg-accent text-muted-foreground"
            }`}
          >
            {t("filters.allFloors")}
          </button>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedFloor === floor ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 hover:bg-accent text-muted-foreground"
              }`}
            >
              {t("filters.floorNumber", { floor })}
            </button>
          ))}
        </div>
      </div>

      {/* Room Board Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const guestName = guestByRoomId.get(room.id);
          return (
            <div
              key={room.id}
              className="bg-card border border-border/60 rounded-3xl p-5 shadow-lg space-y-4 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black tracking-tight text-foreground">#{room.roomNumber}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-medium">({room.roomTypeName})</span>
                </div>
                <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getBadgeStyle(room.derivedStatus)}`}>
                  {getStatusLabel(room.derivedStatus)}
                </span>
              </div>

              {guestName && (
                <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl text-xs">
                  <span className="text-muted-foreground">{t("tile.guestLabel")} </span>
                  <strong className="text-foreground">{guestName}</strong>
                </div>
              )}

              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">{t("tile.housekeepingLabel")}</span>
                <select
                  value={room.housekeepingStatus}
                  disabled={!canChangeStatus || hkMutation.isPending}
                  onChange={(e) => hkMutation.mutate({ roomId: room.id, status: e.target.value })}
                  className="h-8 px-2.5 text-xs font-semibold bg-muted/50 border border-border/60 rounded-lg focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  {HK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {tStatus(opt)}
                    </option>
                  ))}
                </select>
              </div>

              {canBlock && room.operationalStatus !== "BLOCKED" && (
                <button
                  onClick={() => {
                    setBlockRoomId(room.id);
                    setBlockDialogOpen(true);
                  }}
                  className="w-full h-8 rounded-lg text-[11px] font-semibold bg-muted/40 hover:bg-muted text-muted-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Lock className="h-3 w-3" />
                  <span>{t("tile.blockAction")}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <RoomBlockDialog
        isOpen={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        rooms={rooms}
        roomId={blockRoomId}
        onSubmit={(values) => blockMutation.mutate(values)}
        isSubmitting={blockMutation.isPending}
      />
    </div>
  );
}
