"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PageHeader } from "@/components/layout/header";
import { formatDualPrice } from "@/lib/currency";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MinibarItem {
  id: string;
  name: string;
  category: "DRINKS" | "SNACKS" | "OTHER";
  price: number;
}

const ITEMS: MinibarItem[] = [
  { id: "water", name: "Water (500ml)", category: "DRINKS", price: 0.5 },
  { id: "coke", name: "Coca Cola", category: "DRINKS", price: 1.0 },
  { id: "beer", name: "Beer Can", category: "DRINKS", price: 1.5 },
  { id: "chips", name: "Chips", category: "SNACKS", price: 1.0 },
  { id: "peanuts", name: "Roasted Peanuts", category: "SNACKS", price: 0.75 },
  { id: "towel", name: "Extra Towel", category: "OTHER", price: 2.0 },
];

const CATEGORIES = [
  { key: "ALL" },
  { key: "DRINKS" },
  { key: "SNACKS" },
  { key: "OTHER" },
] as const;

export default function MinibarPage() {
  const t = useTranslations("minibar");
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]["key"]>("ALL");
  const [quantities, setQuantities] = React.useState<Record<string, number>>({ water: 2, coke: 1, chips: 1 });

  const adjustQty = (id: string, delta: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  };

  const getCategoryLabel = (key: (typeof CATEGORIES)[number]["key"]) => {
    switch (key) {
      case "ALL":
        return t("categories.all");
      case "DRINKS":
        return t("categories.drinks");
      case "SNACKS":
        return t("categories.snacks");
      default:
        return t("categories.other");
    }
  };

  const visibleItems = category === "ALL" ? ITEMS : ITEMS.filter((item) => item.category === category);
  const itemCount = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const subtotal = ITEMS.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 0), 0);
  const total = formatDualPrice(subtotal);

  const handleCharge = () => {
    if (itemCount === 0) {
      toast.error(t("toasts.addItemFirst"));
      return;
    }
    toast.success(t("toasts.chargedToFolio", { amount: total.usd }));
    setQuantities({});
  };

  return (
    <div>
      {/* Mobile view — matches the "Mini Bar / Store" mockup screen */}
      <div className="md:hidden">
        <MobileHeader
          title={t("mobileTitle")}
          rightSlot={
            <div className="relative h-9 w-9 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
          }
        />

        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                category === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {getCategoryLabel(c.key)}
            </button>
          ))}
        </div>

        <div className="px-4 pb-40 space-y-2.5">
          {visibleItems.map((item) => {
            const price = formatDualPrice(item.price);
            const qty = quantities[item.id] ?? 0;
            return (
              <div key={item.id} className="flex items-center justify-between bg-card border border-border/60 rounded-2xl p-3.5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {price.usd} <span className="text-[11px]">≈ {price.khr}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustQty(item.id, -1)}
                    disabled={qty === 0}
                    aria-label={t("actions.decreaseQuantity", { item: item.name })}
                    className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-foreground">{qty}</span>
                  <button
                    onClick={() => adjustQty(item.id, 1)}
                    aria-label={t("actions.increaseQuantity", { item: item.name })}
                    className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-24 left-0 right-0 p-4 bg-card border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{t("summary.totalItems", { count: itemCount })}</span>
            <div className="text-right">
              <p className="font-black text-primary">{total.usd}</p>
              <p className="text-[11px] text-muted-foreground">≈ {total.khr}</p>
            </div>
          </div>
          <button
            onClick={handleCharge}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 active:scale-[0.99] transition-transform"
          >
            {t("actions.chargeToRoom")}
          </button>
        </div>
      </div>

      {/* Desktop / tablet view */}
      <div className="hidden md:block space-y-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-3">
            {ITEMS.map((item) => {
              const price = formatDualPrice(item.price);
              const qty = quantities[item.id] ?? 0;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {price.usd} <span>≈ {price.khr}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => adjustQty(item.id, -1)}
                      disabled={qty === 0}
                      aria-label={t("actions.decreaseQuantity", { item: item.name })}
                      className="h-11 w-11 rounded-full bg-muted flex items-center justify-center disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{qty}</span>
                    <button
                      onClick={() => adjustQty(item.id, 1)}
                      aria-label={t("actions.increaseQuantity", { item: item.name })}
                      className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-4 h-fit">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/40 pb-2">
              {t("summary.orderSummary")}
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("summary.items")}</span>
              <span className="font-semibold text-foreground">{itemCount}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border/40 pt-3">
              <span>{t("summary.total")}</span>
              <span className="text-primary">{total.usd}</span>
            </div>
            <p className="text-xs text-muted-foreground text-right -mt-2">≈ {total.khr}</p>
            <button
              onClick={handleCharge}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all"
            >
              {t("actions.chargeToRoom")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
