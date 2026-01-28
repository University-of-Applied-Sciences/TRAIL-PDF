"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface PDFFile {
  name: string;
  size: number;
  uploaded_at: string;
  page_count: number;
}

interface ConversionProgress {
  current: number;
  total: number;
  message: string;
}

export default function Home() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [convOptions, setConvOptions] = useState({
    language: "german",
    startPage: 1,
    numPages: 0,
  });
  const [apiDelay, setApiDelay] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = "http://localhost:7777/api";

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/files/`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    const stored = typeof window !== 'undefined' ? localStorage.getItem('api_delay') : null;
    if (stored) setApiDelay(parseFloat(stored));
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await fetch(`${API_BASE}/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchFiles();
      } else {
        alert("Upload fehlgeschlagen");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Fehler beim Upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConvert = async (filename: string) => {
    setIsConverting(filename);
    setConversionProgress({ current: 0, total: 0, message: "Starte Konvertierung..." });

    try {
      const queryParams = new URLSearchParams({
        language: convOptions.language,
        start_page: convOptions.startPage.toString(),
      });
      if (convOptions.numPages > 0) {
        queryParams.append("num_pages", convOptions.numPages.toString());
      }
        if (apiDelay && apiDelay > 0) {
          queryParams.append("api_delay", apiDelay.toString());
        }

      const eventSource = new EventSource(`${API_BASE}/convert/stream/${filename}?${queryParams}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "progress" || data.type === "status") {
          setConversionProgress({
            current: data.current,
            total: data.total,
            message: data.message
          });
        } else if (data.type === "complete") {
          // Decode base64 HTML and trigger download
          const htmlContent = atob(data.html);
          const blob = new Blob([htmlContent], { type: "text/html" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          eventSource.close();
          setIsConverting(null);
          setConversionProgress(null);
        } else if (data.type === "error") {
          alert(`Fehler: ${data.message}`);
          eventSource.close();
          setIsConverting(null);
          setConversionProgress(null);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsConverting(null);
        setConversionProgress(null);
        alert("Verbindung zum Server verloren");
      };

    } catch (error) {
      console.error("Conversion error:", error);
      alert("Fehler bei der Konvertierung");
      setIsConverting(null);
      setConversionProgress(null);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Soll ${filename} wirklich gelöscht werden?`)) return;
    try {
      const response = await fetch(`${API_BASE}/files/${filename}`, { method: "DELETE" });
      if (response.ok) {
        await fetchFiles();
        if (selectedFile?.name === filename) setSelectedFile(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans p-8 text-htw-anthracite">
      <main className="flex w-full max-w-5xl flex-col items-center gap-12 text-center bg-white p-12 rounded-3xl shadow-xl border border-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-5xl font-bold tracking-tight">
            TRAIL <span className="text-htw-green">PDF</span>
          </h1>
          <p className="text-xl text-zinc-600 max-w-xl">
            Transformation zu barrierefreien Dokumenten.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full text-left">
          {/* PDF Section */}
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-htw-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF Konvertierung
            </h2>

            <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-2xl transition-colors ${
                isUploading ? "bg-zinc-100 border-zinc-300 cursor-not-allowed" : "border-htw-green bg-zinc-50 hover:bg-htw-green/5"
              }`}
            >
              <div className={`p-3 rounded-full ${isUploading ? "bg-zinc-200" : "bg-htw-green/10"}`}>
                <svg className={`w-6 h-6 ${isUploading ? "text-zinc-400 animate-pulse" : "text-htw-green"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="font-semibold text-sm">{isUploading ? "Wird hochgeladen..." : "Neues PDF hochladen"}</span>
            </button>

            {files.length > 0 && (
              <div className="flex flex-col gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 max-h-[400px] overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedFile?.name === file.name ? "bg-htw-green/10 border-htw-green ring-1 ring-htw-green" : "bg-white border-zinc-100 hover:border-htw-green/30"
                    }`}
                  >
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="font-medium text-sm truncate">{file.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {file.page_count} Seiten • {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFile && (
              <div className="flex flex-col gap-4 bg-zinc-900 text-white p-6 rounded-2xl text-left animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg truncate pr-4">{selectedFile.name}</h3>
                  <button onClick={() => setSelectedFile(null)} className="text-zinc-500 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 uppercase font-bold tracking-wider">Sprache</span>
                    <select
                      value={convOptions.language}
                      onChange={(e) => setConvOptions({...convOptions, language: e.target.value})}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white outline-none focus:border-htw-green"
                    >
                      <option value="german">Deutsch</option>
                      <option value="english">Englisch</option>
                      <option value="bilingual">Zweisprachig</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 uppercase font-bold tracking-wider">API Delay (s)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={apiDelay}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        setApiDelay(v);
                        try { localStorage.setItem('api_delay', v.toString()); } catch (err) {}
                      }}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white outline-none focus:border-htw-green"
                    />
                    <span className="text-[10px] text-zinc-400">0 = deaktiviert</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 uppercase font-bold tracking-wider">Startseite</span>
                    <input
                      type="number"
                      min="1"
                      max={selectedFile.page_count}
                      value={convOptions.startPage}
                      onChange={(e) => setConvOptions({...convOptions, startPage: parseInt(e.target.value) || 1})}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white outline-none focus:border-htw-green"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 uppercase font-bold tracking-wider">Anzahl Seiten</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Alle"
                      value={convOptions.numPages || ""}
                      onChange={(e) => setConvOptions({...convOptions, numPages: parseInt(e.target.value) || 0})}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white outline-none focus:border-htw-green"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleConvert(selectedFile.name)}
                  disabled={!!isConverting}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    isConverting ? "bg-zinc-800 text-zinc-500 cursor-wait" : "bg-htw-green text-htw-anthracite hover:scale-[1.02] active:scale-95 shadow-lg shadow-htw-green/20"
                  }`}
                >
                  {isConverting ? "Verarbeitung läuft..." : "Konvertierung starten"}
                </button>

                {/* Progress indicator */}
                {conversionProgress && isConverting && (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-htw-green font-medium">{conversionProgress.message}</span>
                      {conversionProgress.total > 0 && (
                        <span className="text-zinc-400">
                          {Math.round((conversionProgress.current / conversionProgress.total) * 100)}%
                        </span>
                      )}
                    </div>
                    {conversionProgress.total > 0 && (
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-htw-green h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${(conversionProgress.current / conversionProgress.total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Link to Image Analysis */}
          <div className="flex flex-col gap-6 lg:border-l lg:border-zinc-200 lg:pl-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-htw-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Einzelbild Analyse
            </h2>

            <Link href="/image" className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50 hover:bg-htw-green/5 hover:border-htw-green transition-all group">
              <div className="p-4 bg-zinc-200 rounded-full group-hover:bg-htw-green/20 group-hover:scale-110 transition-all">
                <svg className="w-8 h-8 text-zinc-500 group-hover:text-htw-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <span className="font-bold text-lg text-zinc-700 group-hover:text-htw-green transition-colors block">Zur Einzelbild-Analyse</span>
                <span className="text-sm text-zinc-500">Einzelne Bilder analysieren und Alt-Texte generieren</span>
              </div>
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-htw-green group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
