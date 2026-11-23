export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10" aria-busy="true">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-9 w-64 rounded-lg bg-gray-200" />
        <div className="h-5 w-96 max-w-full rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-gray-200" />
      </div>
    </main>
  );
}
