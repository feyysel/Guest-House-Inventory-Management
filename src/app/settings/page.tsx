
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Save,
  Settings as SettingsIcon,
  Clock,
  Banknote,
  CheckCircle2,
} from "lucide-react";

type SettingsForm = {
  guesthouseName: string;
  email: string;
  phone: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
};

const defaults: SettingsForm = {
  guesthouseName: "HavenStay Guest House",
  email: "",
  phone: "",
  address: "",
  checkInTime: "12:00",
  checkOutTime: "11:00",
  currency: "ETB",
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load settings.");
        }

        setForm({
          guesthouseName: data.guesthouseName ?? defaults.guesthouseName,
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          checkInTime: data.checkInTime ?? defaults.checkInTime,
          checkOutTime: data.checkOutTime ?? defaults.checkOutTime,
          currency: data.currency ?? defaults.currency,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField<K extends keyof SettingsForm>(
    field: K,
    value: SettingsForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setError("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setForm({
        guesthouseName: data.guesthouseName ?? defaults.guesthouseName,
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        checkInTime: data.checkInTime ?? defaults.checkInTime,
        checkOutTime: data.checkOutTime ?? defaults.checkOutTime,
        currency: data.currency ?? defaults.currency,
      });

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-5xl text-sm text-gray-500">
          Loading guesthouse settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your guesthouse information and preferences.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="text-blue-600" size={21} />
              <div>
                <h2 className="font-semibold text-gray-900">
                  Guesthouse Information
                </h2>
                <p className="text-sm text-gray-500">
                  Basic details about your property.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Guesthouse name
                <input
                  required
                  value={form.guesthouseName}
                  onChange={(e) => updateField("guesthouseName", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Contact email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="example@email.com"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Phone number
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+251..."
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Address
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Guesthouse address"
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <Clock className="text-blue-600" size={21} />
              <div>
                <h2 className="font-semibold text-gray-900">
                  Check-in & Check-out
                </h2>
                <p className="text-sm text-gray-500">
                  Set your standard guest arrival and departure times.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Check-in time
                <input
                  type="time"
                  required
                  value={form.checkInTime}
                  onChange={(e) => updateField("checkInTime", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Check-out time
                <input
                  type="time"
                  required
                  value={form.checkOutTime}
                  onChange={(e) => updateField("checkOutTime", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <Banknote className="text-blue-600" size={21} />
              <div>
                <h2 className="font-semibold text-gray-900">
                  Regional Preferences
                </h2>
                <p className="text-sm text-gray-500">
                  Choose the currency used to display prices.
                </p>
              </div>
            </div>

            <label className="block max-w-md text-sm font-medium text-gray-700">
              Currency
              <select
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className={`${inputClass} bg-white`}
              >
                <option value="ETB">ETB — Ethiopian Birr</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </label>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              {saved && (
                <p className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <CheckCircle2 size={18} />
                  Settings saved successfully.
                </p>
              )}

              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
