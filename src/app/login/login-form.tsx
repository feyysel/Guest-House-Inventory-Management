"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { signIn } from "./actions";

const demoAccounts = [
  {
    label: "Administrator",
    email: "admin@havenstay.test",
    password: "Admin@123",
    access: "Everything, including staff accounts",
  },
  {
    label: "Manager",
    email: "manager@havenstay.test",
    password: "Manager@123",
    access: "Operations, payments, reports, settings",
  },
  {
    label: "Receptionist",
    email: "receptionist@havenstay.test",
    password: "Staff@123",
    access: "Rooms, reservations, guests, payments",
  },
];

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-2">
          <div className="bg-teal-800 p-8 text-white sm:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-lg font-bold">HavenStay</p>
                <p className="text-xs text-teal-200">GUESTHOUSE MANAGER</p>
              </div>
            </div>

            <h1 className="mt-12 text-3xl font-bold sm:text-4xl">
              Welcome back.
            </h1>
            <p className="mt-3 text-sm text-teal-100">
              Sign in to manage rooms, reservations, guests, and payments.
            </p>

            <div className="mt-10 rounded-2xl bg-teal-900/40 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={18} />
                Role-based access
              </div>
              <p className="mt-2 text-xs leading-5 text-teal-100">
                Each account sees only the menu and actions allowed for its
                role. Pick a demo account below to try each access level.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use your staff email and password.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="you@havenstay.test"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="Your password"
                />
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Demo accounts
              </p>
              <div className="mt-3 space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                      setError("");
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        {account.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {account.access}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-slate-500">
                      {account.password}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
