import type { UserRole } from "@/generated/prisma/client";

export type Permission =
  | "dashboard:view"
  | "rooms:view"
  | "rooms:create"
  | "rooms:update"
  | "rooms:delete"
  | "reservations:view"
  | "reservations:create"
  | "reservations:update"
  | "guests:view"
  | "guests:create"
  | "guests:update"
  | "guests:delete"
  | "payments:view"
  | "payments:create"
  | "payments:update"
  | "reports:view"
  | "settings:view"
  | "settings:update"
  | "users:view"
  | "users:create"
  | "users:update"
  | "users:delete";

export const permissionLabels: Record<Permission, string> = {
  "dashboard:view": "View dashboard",
  "rooms:view": "View rooms",
  "rooms:create": "Add rooms",
  "rooms:update": "Edit rooms",
  "rooms:delete": "Delete rooms",
  "reservations:view": "View reservations",
  "reservations:create": "Create reservations",
  "reservations:update": "Update reservation status",
  "guests:view": "View guests",
  "guests:create": "Add guests",
  "guests:update": "Edit guests",
  "guests:delete": "Delete guests",
  "payments:view": "View payments",
  "payments:create": "Record payments",
  "payments:update": "Change payment status",
  "reports:view": "View reports",
  "settings:view": "View settings",
  "settings:update": "Edit settings",
  "users:view": "Manage users",
  "users:create": "Add users",
  "users:update": "Edit users",
  "users:delete": "Delete users",
};

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
};

export const roleDescriptions: Record<UserRole, string> = {
  ADMIN: "Full access, including staff accounts and deleting records.",
  MANAGER: "Daily operations, payments, reports, and settings. No staff accounts or deletions.",
  RECEPTIONIST: "Front desk work: rooms, reservations, guests, and payments.",
};

const receptionistPermissions: Permission[] = [
  "dashboard:view",
  "rooms:view",
  "rooms:create",
  "rooms:update",
  "reservations:view",
  "reservations:create",
  "reservations:update",
  "guests:view",
  "guests:create",
  "guests:update",
  "payments:view",
  "payments:create",
];

const managerPermissions: Permission[] = [
  ...receptionistPermissions,
  "payments:update",
  "reports:view",
  "settings:view",
  "settings:update",
];

const adminPermissions: Permission[] = [
  ...managerPermissions,
  "rooms:delete",
  "guests:delete",
  "users:view",
  "users:create",
  "users:update",
  "users:delete",
];

export const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: adminPermissions,
  MANAGER: managerPermissions,
  RECEPTIONIST: receptionistPermissions,
};

export function can(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export type NavItem = {
  label: string;
  href: string;
  permission: Permission;
};

export const navigation: NavItem[] = [
  { label: "Dashboard", href: "/", permission: "dashboard:view" },
  { label: "Rooms", href: "/rooms", permission: "rooms:view" },
  {
    label: "Reservations",
    href: "/reservations",
    permission: "reservations:view",
  },
  { label: "Guests", href: "/guests", permission: "guests:view" },
  { label: "Payments", href: "/payments", permission: "payments:view" },
  { label: "Reports", href: "/reports", permission: "reports:view" },
  { label: "Users", href: "/users", permission: "users:view" },
];

export const settingsNavItem: NavItem = {
  label: "Settings",
  href: "/settings",
  permission: "settings:view",
};
