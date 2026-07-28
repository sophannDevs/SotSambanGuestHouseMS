"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Button } from "@/components/ui/button";
import { formatDualPrice } from "@/lib/currency";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { RoomDto, RoomTypeDto, AmenityDto, BulkCreateRoomsRequest, RoomTypeRequest } from "@/lib/api-types";
import { Layers, Plus, BedDouble, Tag, Filter, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BulkCreateDialog } from "@/components/rooms/bulk-create-dialog";
import { RoomTypeFormDialog } from "@/components/rooms/room-type-form-dialog";

export default function RoomsPage() {
  const t = useTranslations("rooms");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const canView = hasHydrated && hasPermission("room:view");
  const canEdit = hasHydrated && hasPermission("room:edit");

  const [activeTab, setActiveTab] = React.useState<"inventory" | "types">("inventory");
  const [search, setSearch] = React.useState("");
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState<RoomTypeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<RoomTypeDto | null>(null);

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms"),
    enabled: canView,
  });
  const roomTypesQuery = useQuery({
    queryKey: ["room-types"],
    queryFn: () => apiFetch<RoomTypeDto[]>("/room-types"),
    enabled: canView,
  });
  const amenitiesQuery = useQuery({
    queryKey: ["amenities"],
    queryFn: () => apiFetch<AmenityDto[]>("/amenities"),
    enabled: canView,
  });

  const rooms = roomsQuery.data ?? [];
  const roomTypes = roomTypesQuery.data ?? [];
  const amenities = amenitiesQuery.data ?? [];

  const filteredRooms = rooms.filter(
    (room) => room.roomNumber.toLowerCase().includes(search.toLowerCase()) || room.roomTypeName.toLowerCase().includes(search.toLowerCase())
  );

  const bulkCreateMutation = useMutation({
    mutationFn: (values: BulkCreateRoomsRequest) => apiFetch<RoomDto[]>("/rooms/bulk-create", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("toast.bulkCreateSuccess", { count: created.length }));
      setBulkDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const roomTypeMutation = useMutation({
    mutationFn: (values: RoomTypeRequest) =>
      editingType
        ? apiFetch<RoomTypeDto>(`/room-types/${editingType.id}`, { method: "PUT", body: JSON.stringify(values) })
        : apiFetch<RoomTypeDto>("/room-types", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      toast.success(editingType ? t("toast.typeUpdated") : t("toast.typeCreated"));
      setTypeDialogOpen(false);
      setEditingType(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/room-types/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      toast.success(t("toast.typeDeleted"));
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setDeleteTarget(null);
    },
  });

  const isLoading = !hasHydrated || (activeTab === "inventory" ? roomsQuery.isLoading : roomTypesQuery.isLoading);
  const isError = activeTab === "inventory" ? roomsQuery.isError : roomTypesQuery.isError;

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader
          title={t("mobileTitle")}
          rightSlot={
            <button
              aria-label={t("filterRoomsAriaLabel")}
              className="h-9 w-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
            >
              <Filter className="h-5 w-5" />
            </button>
          }
        />
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3.5 h-11 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {roomsQuery.isLoading ? (
            <PageSkeleton />
          ) : roomsQuery.isError ? (
            <ErrorState title={t("loadError")} onRetry={() => roomsQuery.refetch()} />
          ) : (
            <div className="space-y-3">
              {filteredRooms.map((room) => {
                const roomType = roomTypes.find((rt) => rt.id === room.roomTypeId);
                const price = roomType ? formatDualPrice(roomType.basePrice) : null;
                return (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="flex gap-3 bg-card border border-border/60 rounded-2xl p-3 shadow-sm active:scale-[0.99] transition-transform"
                  >
                    <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 flex items-center justify-center">
                      <BedDouble className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-foreground">{room.roomNumber}</p>
                          <p className="text-xs text-muted-foreground">{room.roomTypeName}</p>
                        </div>
                        <StatusBadge status={room.derivedStatus} />
                      </div>
                      {price && (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-primary">{price.usd}</span>
                          <span className="text-[11px] text-muted-foreground">≈ {price.khr}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actionLabel={canEdit ? t("actions.bulkCreateRooms") : undefined}
          actionIcon={Layers}
          onAction={() => setBulkDialogOpen(true)}
        />

        <div className="flex border-b border-border/40 space-x-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "inventory" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BedDouble className="h-4 w-4" />
            <span>{t("tabs.inventory", { count: rooms.length })}</span>
          </button>

          <button
            onClick={() => setActiveTab("types")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "types" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>{t("tabs.types", { count: roomTypes.length })}</span>
          </button>
        </div>

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState title={t("loadError")} onRetry={() => (activeTab === "inventory" ? roomsQuery.refetch() : roomTypesQuery.refetch())} />
        ) : activeTab === "inventory" ? (
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{t("sections.allRooms")}</h3>
              {canEdit && (
                <button
                  onClick={() => setBulkDialogOpen(true)}
                  className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t("actions.addRooms")}</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
                    <th className="py-3 px-4">{t("table.roomNumber")}</th>
                    <th className="py-3 px-4">{t("table.roomType")}</th>
                    <th className="py-3 px-4">{t("table.floor")}</th>
                    <th className="py-3 px-4">{t("table.maxOccupancy")}</th>
                    <th className="py-3 px-4">{t("table.priceNight")}</th>
                    <th className="py-3 px-4">{t("table.status")}</th>
                    <th className="py-3 px-4 text-right">{t("table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredRooms.map((room) => {
                    const roomType = roomTypes.find((rt) => rt.id === room.roomTypeId);
                    return (
                      <tr key={room.id} className="hover:bg-muted/30">
                        <td className="py-3.5 px-4 font-bold">{room.roomNumber}</td>
                        <td className="py-3.5 px-4">{room.roomTypeName}</td>
                        <td className="py-3.5 px-4">{room.floor}</td>
                        <td className="py-3.5 px-4">{t("table.adultsCount", { count: room.maxOccupancy })}</td>
                        <td className="py-3.5 px-4 font-semibold">{roomType ? <MoneyDisplay amount={roomType.basePrice} /> : "—"}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={room.derivedStatus} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/rooms/${room.id}`} className="font-medium text-primary hover:underline">
                            {tCommon("actions.view")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRooms.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{tCommon("status.noResults")}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditingType(null);
                    setTypeDialogOpen(true);
                  }}
                >
                  <Plus />
                  <span>{t("actions.addRoomType")}</span>
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomTypes.map((rt) => {
                const price = formatDualPrice(rt.basePrice);
                return (
                  <div key={rt.id} className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-foreground">{rt.name}</h4>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{rt.code}</span>
                          {!rt.active && <StatusBadge status="INACTIVE" />}
                        </div>
                        {rt.description && <p className="text-xs text-muted-foreground mt-0.5">{rt.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-black text-primary">{price.usd}</span>
                        <p className="text-[11px] text-muted-foreground">≈ {price.khr} {t("perNight")}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        {t("card.capacity", {
                          adults: rt.maxAdults,
                          children: rt.maxChildren,
                          beds: rt.bedCount,
                          bedType: t.has(`typeDialog.bedTypes.${rt.bedType}`) ? t(`typeDialog.bedTypes.${rt.bedType}`) : rt.bedType,
                        })}
                      </p>
                      {rt.roomSizeSqm && <p>{t("card.size", { size: rt.roomSizeSqm })}</p>}
                      {rt.amenities.length > 0 && <p>{t("card.amenities", { list: rt.amenities.map((a) => a.name).join(", ") })}</p>}
                    </div>
                    {canEdit && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                        <button
                          onClick={() => {
                            setEditingType(rt);
                            setTypeDialogOpen(true);
                          }}
                          className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>{tCommon("actions.edit")}</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rt)}
                          className="px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{tCommon("actions.delete")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {roomTypes.length === 0 && <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">{tCommon("status.noResults")}</p>}
            </div>
          </div>
        )}
      </div>

      <BulkCreateDialog
        isOpen={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        roomTypes={roomTypes}
        onSubmit={(values) => bulkCreateMutation.mutate(values)}
        isSubmitting={bulkCreateMutation.isPending}
      />

      <RoomTypeFormDialog
        isOpen={typeDialogOpen}
        onClose={() => {
          setTypeDialogOpen(false);
          setEditingType(null);
        }}
        roomType={editingType}
        amenities={amenities}
        onSubmit={(values) => roomTypeMutation.mutate(values)}
        isSubmitting={roomTypeMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("deleteDialog.title")}
        description={deleteTarget ? t("deleteDialog.description", { name: deleteTarget.name }) : ""}
        confirmLabel={tCommon("actions.delete")}
        onConfirm={() => deleteTarget && deleteTypeMutation.mutate(deleteTarget.id)}
        variant="destructive"
      />
    </div>
  );
}
