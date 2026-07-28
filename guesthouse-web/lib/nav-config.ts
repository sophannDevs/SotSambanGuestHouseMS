import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  LogIn,
  LogOut,
  Hotel,
  BedDouble,
  Sparkles,
  Wrench,
  CreditCard,
  Receipt,
  BarChart3,
  Users,
  UserCheck,
  Bell,
  Settings,
  ShoppingCart,
} from "lucide-react";

export interface NavItem {
  id: string;
  titleKey: string;
  href: string;
  icon: LucideIcon;
  permission: string;
  children?: { titleKey: string; href: string }[];
}

export interface NavGroup {
  id: string;
  titleKey: string;
  items: NavItem[];
}

// Single source of truth for navigation, consumed by the desktop sidebar,
// the mobile bottom nav, and the mobile "More" page — replaces three
// independently hand-kept lists that had already drifted out of sync
// (current-ui-audit.md §5/§8). Grouping follows the task brief's own
// Operations/Property/Finance/Management shell spec rather than
// product-requirements.md FR-001's flat 16-item wording, since the brief
// is the more specific, more recent instruction for this exact component.
//
// titleKey values resolve against the "nav" message namespace
// (messages/en.json / messages/km.json) via useTranslations("nav").
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "operations",
    titleKey: "groups.operations",
    items: [
      { id: "dashboard", titleKey: "items.dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      { id: "reservations", titleKey: "items.reservations", href: "/reservations", icon: CalendarCheck, permission: "reservation:view" },
      { id: "calendar", titleKey: "items.calendar", href: "/calendar", icon: CalendarDays, permission: "availability:view" },
      { id: "check-in", titleKey: "items.check-in", href: "/check-in", icon: LogIn, permission: "checkin:view" },
      { id: "in-house", titleKey: "items.in-house", href: "/in-house", icon: Hotel, permission: "reservation:view" },
      { id: "check-out", titleKey: "items.check-out", href: "/check-out", icon: LogOut, permission: "checkout:view" },
    ],
  },
  {
    id: "property",
    titleKey: "groups.property",
    items: [
      {
        id: "rooms",
        titleKey: "items.rooms",
        href: "/rooms",
        icon: BedDouble,
        permission: "room:view",
        // Fixes the orphaned /rooms/board route (current-ui-audit.md §8 —
        // zero links to it anywhere) by exposing it as a Rooms sub-item
        // instead of a page-content change, keeping the fix inside Phase 3's
        // shell scope.
        children: [
          { titleKey: "roomsChildren.all", href: "/rooms" },
          { titleKey: "roomsChildren.board", href: "/rooms/board" },
        ],
      },
      { id: "housekeeping", titleKey: "items.housekeeping", href: "/housekeeping", icon: Sparkles, permission: "housekeeping:view" },
      { id: "maintenance", titleKey: "items.maintenance", href: "/maintenance", icon: Wrench, permission: "maintenance:view" },
    ],
  },
  {
    id: "finance",
    titleKey: "groups.finance",
    items: [
      { id: "payments", titleKey: "items.payments", href: "/payments", icon: CreditCard, permission: "payment:view" },
      { id: "expenses", titleKey: "items.expenses", href: "/expenses", icon: Receipt, permission: "expense:view" },
      { id: "reports", titleKey: "items.reports", href: "/reports", icon: BarChart3, permission: "report:view" },
    ],
  },
  {
    id: "management",
    titleKey: "groups.management",
    items: [
      { id: "guests", titleKey: "items.guests", href: "/guests", icon: Users, permission: "guest:view" },
      { id: "staff", titleKey: "items.staff", href: "/staff", icon: UserCheck, permission: "staff:view" },
      { id: "notifications", titleKey: "items.notifications", href: "/notifications", icon: Bell, permission: "notification:view" },
      { id: "settings", titleKey: "items.settings", href: "/settings", icon: Settings, permission: "settings:view" },
    ],
  },
];

// Not one of the 16 canonical modules (source-brief B5) — kept out of
// NAV_GROUPS/the desktop sidebar (matching its current scope) but still
// reachable via the mobile "More" page, matching its current scope there.
const MORE_ONLY_ITEMS: NavItem[] = [
  { id: "minibar", titleKey: "items.minibar", href: "/minibar", icon: ShoppingCart, permission: "service:view" },
];

export function flattenNavItems(): NavItem[] {
  return NAV_GROUPS.flatMap((group) => group.items);
}

function findNavItem(id: string): NavItem {
  const item = flattenNavItems().find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`nav-config: unknown nav item id "${id}"`);
  }
  return item;
}

// The canonical mobile bottom nav is exactly Dashboard · Reservations ·
// Calendar · Guests · More (conventions.md §11, source-brief B5) — the
// previous implementation substituted Rooms for Calendar and Guests,
// making two of the five documented tabs unreachable from the bottom bar
// (current-ui-audit.md's responsive findings).
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  findNavItem("dashboard"),
  findNavItem("reservations"),
  findNavItem("calendar"),
  findNavItem("guests"),
];

// Everything not already reachable via its own bottom-nav tab, for the
// mobile "/more" page — grouped the same way as the desktop sidebar so the
// two surfaces stay recognizably consistent.
export function getMoreNavGroups(): NavGroup[] {
  const bottomHrefs = new Set(BOTTOM_NAV_ITEMS.map((item) => item.href));
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !bottomHrefs.has(item.href)),
  })).filter((group) => group.items.length > 0);

  return [...groups, { id: "more", titleKey: "groups.more", items: MORE_ONLY_ITEMS }];
}
