"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  setUserActive,
  updateUserRole,
} from "./actions";
import {
  can,
  roleDescriptions,
  type Permission,
} from "@/lib/permissions";
import { useAppSelector } from "@/store";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

type Props = {
  users: StaffUser[];
  currentUserId: string;
  roleLabels: Record<UserRole, string>;
  roles: UserRole[];
  rolePermissions: Record<UserRole, Permission[]>;
  permissionLabels: Record<Permission, string>;
};

export default function UsersManager({
  users,
  currentUserId,
  roleLabels,
  roles,
  rolePermissions,
  permissionLabels,
}: Props) {
  const router = useRouter();
  const guesthouseName = useAppSelector(
    (state) => state.ui.guesthouseName
  );
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("RECEPTIONIST");
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  const permissions = Object.keys(permissionLabels) as Permission[];

  function runAction(
    action: () => Promise<{ success: boolean; message: string }>
  ) {
    setMessage("");

    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
      setMessageSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    runAction(async () => {
      const result = await createUser({ name, email, password, role });

      if (result.success) {
        setName("");
        setEmail("");
        setPassword("");
        setRole("RECEPTIONIST");
      }

      return result;
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium text-teal-700">
            {guesthouseName.toUpperCase()} / ADMINISTRATION
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create staff accounts, assign roles, and control access.
          </p>
        </header>

        {message && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm ${
              messageSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold">Add a staff account</h2>
          <p className="mt-1 text-sm text-slate-500">
            New users can sign in immediately with the password you set.
          </p>

          <form
            onSubmit={handleCreate}
            className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <label className="text-sm font-medium text-slate-700">
              Name *
              <input
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="Full name"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Email *
              <input
                required
                type="email"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="staff@havenstay.test"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Password *
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="At least 8 characters"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Role *
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as UserRole)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabels[item]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add user"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold">Staff accounts</h2>
            <p className="mt-1 text-sm text-slate-500">
              {users.length} account(s). You cannot change or delete your own
              account here.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Added {user.createdAt}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{user.email}</td>
                      <td className="px-5 py-4">
                        <select
                          value={user.role}
                          disabled={isSelf || isPending}
                          onChange={(event) =>
                            runAction(() =>
                              updateUserRole(user.id, event.target.value)
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 disabled:opacity-50"
                        >
                          {roles.map((item) => (
                            <option key={item} value={item}>
                              {roleLabels[item]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isSelf || isPending}
                            onClick={() =>
                              runAction(() =>
                                setUserActive(user.id, !user.active)
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              const nextPassword = window.prompt(
                                `New password for ${user.name} (at least 8 characters):`
                              );

                              if (nextPassword) {
                                runAction(() =>
                                  resetUserPassword(user.id, nextPassword)
                                );
                              }
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Reset password
                          </button>

                          <button
                            type="button"
                            disabled={isSelf || isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete ${user.name}'s account?`
                                )
                              ) {
                                runAction(() => deleteUser(user.id));
                              }
                            }}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold">What each role can do</h2>
          <p className="mt-1 text-sm text-slate-500">
            This is the access matrix enforced on pages, actions, and APIs.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {roles.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 p-4"
              >
                <h3 className="font-semibold">{roleLabels[item]}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {roleDescriptions[item]}
                </p>
                <p className="mt-3 text-xs font-semibold text-teal-700">
                  {rolePermissions[item].length} permissions
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Permission</th>
                  {roles.map((item) => (
                    <th key={item} className="px-4 py-3 font-semibold">
                      {roleLabels[item]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((permission) => (
                  <tr key={permission}>
                    <td className="px-4 py-3 text-slate-700">
                      {permissionLabels[permission]}
                    </td>
                    {roles.map((item) => (
                      <td key={item} className="px-4 py-3">
                        {can(item, permission) ? (
                          <span className="font-semibold text-emerald-600">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
