
import Link from "next/link";
import CreateGuestForm from "@/components/guests/create-guest-form";

export default function NewGuestPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/guests"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Guests
          </Link>

          <p className="mt-5 text-sm font-medium text-blue-600">
            HAVENSTAY / MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Add New Guest
          </h1>

          <p className="mt-2 text-gray-500">
            Register a guest and keep their information organized.
          </p>
        </div>

        <CreateGuestForm />
      </div>
    </main>
  );
}
