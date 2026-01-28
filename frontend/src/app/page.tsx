import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans p-8">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 text-center bg-white p-12 rounded-3xl shadow-xl border border-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-htw-anthracite">
            TRAIL <span className="text-htw-green">PDF</span>
          </h1>
          <p className="text-xl text-zinc-600 max-w-xl">
            Transcription and Reading Accessibility Improvement Layer.
            Konvertiere PDFs in barrierefreies HTML für Screenreader.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-htw-green rounded-2xl bg-zinc-50 hover:bg-htw-green/5 transition-colors group">
            <div className="p-4 bg-htw-green/10 rounded-full group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-htw-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <span className="font-semibold text-htw-anthracite">PDF hochladen</span>
          </button>

          <button className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors group">
            <div className="p-4 bg-zinc-200 rounded-full group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold text-htw-anthracite">Einzelnes Bild analysieren</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-zinc-500">
            Unterstützt durch GPT-4o Vision API
          </p>
          <div className="flex gap-4">
            <span className="text-xs font-bold text-white bg-htw-green px-2 py-1 rounded">HTW BERLIN</span>
          </div>
        </div>
      </main>
    </div>
  );
}
