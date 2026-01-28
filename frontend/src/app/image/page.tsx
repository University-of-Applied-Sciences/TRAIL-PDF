"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function ImageAnalysis() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageOptions, setImageOptions] = useState({
    promptType: "standard",
    language: "german",
  });

  const imageInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = "http://localhost:7777/api";

  // Paste handler für Bilder
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImageResult(null);
      }
    } else if (e.clipboardData && e.clipboardData.items) {
      // Fallback für Browser, die files nicht direkt setzen
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            setImageFile(file);
            setImageResult(null);
            break;
          }
        }
      }
    }
  };

  const processImage = async () => {
    if (!imageFile) return;
    setIsImageProcessing(true);
    setImageResult(null);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("prompt_type", imageOptions.promptType);
    formData.append("language", imageOptions.language);

    try {
      const response = await fetch(`${API_BASE}/images/process`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageResult(data.alt_text);
      } else {
        alert("Bildverarbeitung fehlgeschlagen");
      }
    } catch (error) {
      console.error("Image error:", error);
      alert("Fehler bei der Bildverarbeitung");
    } finally {
      setIsImageProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans p-8 text-htw-anthracite" onPaste={handlePaste} tabIndex={0}>
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center bg-white p-12 rounded-3xl shadow-xl border border-zinc-200">
        {/* Header with back link */}
        <div className="w-full flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-500 hover:text-htw-green transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Zurück zur PDF-Konvertierung</span>
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Einzelbild <span className="text-htw-green">Analyse</span>
          </h1>
          <p className="text-lg text-zinc-600 max-w-md">
            Generiere barrierefreie Alt-Texte für einzelne Bilder mit GPT-4o Vision.
          </p>
        </div>

        <div className="flex flex-col gap-6 w-full text-left">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={imageInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                setImageResult(null);
              }
            }}
          />

          {!imageFile ? (
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex flex-col items-center gap-4 p-16 border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50 hover:bg-htw-green/5 hover:border-htw-green transition-all group"
            >
              <div className="p-4 bg-zinc-200 rounded-full group-hover:bg-htw-green/20 group-hover:scale-110 transition-all">
                <svg className="w-10 h-10 text-zinc-500 group-hover:text-htw-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-center">
                <span className="font-bold text-lg text-zinc-700 group-hover:text-htw-green transition-colors block">Bild auswählen oder <span className="underline">STRG+V</span> zum Einfügen</span>
                <span className="text-sm text-zinc-500">PNG, JPG, GIF oder WEBP – auch direkt aus der Zwischenablage</span>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-5 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Vorschau"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  onClick={() => { setImageFile(null); setImageResult(null); }}
                  className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Bild entfernen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">{imageFile.name}</span>
                <span className="text-zinc-400">•</span>
                <span>{(imageFile.size / 1024).toFixed(1)} KB</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Analyse-Modus</label>
                  <select
                    value={imageOptions.promptType}
                    onChange={(e) => setImageOptions({...imageOptions, promptType: e.target.value})}
                    className="bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-htw-green focus:ring-1 focus:ring-htw-green transition-all"
                  >
                    <option value="standard">Standard</option>
                    <option value="table">Tabelle</option>
                    <option value="math">Mathematik</option>
                    <option value="code">Quellcode</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Sprache</label>
                  <select
                    value={imageOptions.language}
                    onChange={(e) => setImageOptions({...imageOptions, language: e.target.value})}
                    className="bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-htw-green focus:ring-1 focus:ring-htw-green transition-all"
                  >
                    <option value="german">Deutsch</option>
                    <option value="english">Englisch</option>
                  </select>
                </div>
              </div>

              <button
                onClick={processImage}
                disabled={isImageProcessing}
                className={`py-3 rounded-xl font-bold transition-all ${
                  isImageProcessing
                    ? "bg-zinc-200 text-zinc-500 cursor-wait"
                    : "bg-htw-green text-htw-anthracite hover:scale-[1.02] active:scale-95 shadow-lg shadow-htw-green/20"
                }`}
              >
                {isImageProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bild wird analysiert...
                  </span>
                ) : "Bild analysieren"}
              </button>
            </div>
          )}

          {imageResult && (
            <div className="flex flex-col gap-3 p-6 bg-white border-2 border-htw-green/30 rounded-2xl animate-in zoom-in-95 duration-200 shadow-lg shadow-htw-green/5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-htw-green rounded-full"></div>
                  <span className="text-sm font-bold text-htw-green uppercase tracking-wider">Generierter Alt-Text</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(imageResult);
                    // Could add a toast notification here
                  }}
                  className="text-xs text-zinc-400 hover:text-htw-green flex items-center gap-1 px-2 py-1 rounded hover:bg-htw-green/10 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  In Zwischenablage kopieren
                </button>
              </div>
              <div className="text-sm max-h-[400px] overflow-y-auto pt-2 text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono bg-zinc-50 p-4 rounded-lg">
                {imageResult}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
