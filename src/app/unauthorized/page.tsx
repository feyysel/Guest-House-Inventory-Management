import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  roleDescriptions,
  roleLabels,
} from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const user = await requireUser();

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Access restricted
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Your role ({roleLabels[user.role]}) does not have permission to open
          this page or perform that action.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {roleDescriptions[user.role]}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
