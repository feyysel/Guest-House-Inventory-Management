
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import EditGuestForm from "@/components/guests/edit-guest-form";
import { getGuesthouseSettings } from "@/lib/settings";
import { requirePermission } from "@/lib/session";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditGuestPage({ params }: Props) {
  await requirePermission("guests:view");

  const { id } = await params;

  const [guest, settings] = await Promise.all([
    prisma.guest.findUnique({
      where: { id },
    }),
    getGuesthouseSettings(),
  ]);

  if (!guest) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href={`/guests/${guest.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Guest Details
          </Link>

          <p className="mt-5 text-sm font-medium text-blue-600">
            {settings.guesthouseName.toUpperCase()} / MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Edit Guest
          </h1>

          <p className="mt-2 text-gray-500">
            Update information for {guest.firstName} {guest.lastName}.
          </p>
        </div>

        <EditGuestForm
          guest={{
            id: guest.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            phone: guest.phone,
            email: guest.email,
            address: guest.address,
            nationality: guest.nationality,
            notes: guest.notes,
          }}
        />
      </div>
    </main>
  );
}
