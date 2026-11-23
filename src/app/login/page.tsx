import { redirect } from "next/navigation";
import LoginForm, { type DemoAccount } from "./login-form";
import { getSession } from "@/lib/session";
import { getGuesthouseSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const developmentDemoAccounts: DemoAccount[] = [
  {
    role: "ADMIN",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@havenstay.test",
    password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123",
    access: "Everything, including staff accounts",
  },
  {
    role: "MANAGER",
    email: process.env.SEED_MANAGER_EMAIL ?? "manager@havenstay.test",
    password: process.env.SEED_MANAGER_PASSWORD ?? "Manager@123",
    access: "Operations, payments, reports, settings",
  },
  {
    role: "RECEPTIONIST",
    email: process.env.SEED_RECEPTIONIST_EMAIL ?? "receptionist@havenstay.test",
    password: process.env.SEED_RECEPTIONIST_PASSWORD ?? "Staff@123",
    access: "Rooms, reservations, guests, payments",
  },
];

export default async function LoginPage() {
  const [session, settings] = await Promise.all([
    getSession(),
    getGuesthouseSettings(),
  ]);

  if (session) {
    redirect("/");
  }

  return (
    <LoginForm
      guesthouseName={settings.guesthouseName}
      demoAccounts={
        process.env.NODE_ENV === "production"
          ? undefined
          : developmentDemoAccounts
      }
    />
  );
}
