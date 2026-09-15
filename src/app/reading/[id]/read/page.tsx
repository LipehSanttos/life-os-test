"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Type,
  Maximize2,
  Minimize2,
  X,
  BookOpen,
  Loader2,
  Settings2,
  Check,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import { BookData, BookReadingSettings } from "@/types";
import { toast } from "sonner";
import { getEbookFromIndexedDB, saveEbookToIndexedDB } from "@/lib/ebookStorage";

// Importações dinâmicas para evitar incompatibilidades de SSR com Canvas e iframes
const EpubReader = dynamic(() => import("@/components/reading/EpubReader"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      <span className="text-xs font-semibold text-muted-foreground">Preparando leitor EPUB...</span>
    </div>
  ),
});

const PdfReader = dynamic(() => import("@/components/reading/PdfReader"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      <span className="text-xs font-semibold text-muted-foreground">Preparando leitor PDF...</span>
    </div>
  ),
});

const DEFAULT_SETTINGS: Required<BookReadingSettings> = {
  theme: "dark",
  fontSize: 18,
  fontFamily: "serif",
  lineHeight: 1.6,
};

export default function BookReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;

  const [book, setBook] = useState<BookData | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showBars, setShowBars] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // TOC / Sumário
  const [toc, setToc] = useState<Array<{ title: string; target: string; page?: number }>>([]);

  // Estado de Leitura
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  // Configurações do Leitor Digital
  const [settings, setSettings] = useState<Required<BookReadingSettings>>(DEFAULT_SETTINGS);

  const readerRef = useRef<{
    nextPage: () => void;
    prevPage: () => void;
    goToLocation?: (target: string) => void;
    goToPage?: (page: number) => void;
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Revoga URL de Blob temporário ao desmontar
  useEffect(() => {
    return () => {
      if (resolvedUrl && resolvedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resolvedUrl);
      }
    };
  }, [resolvedUrl]);

  // 1. Carrega dados do livro e resolve URL (Supabase, local ou IndexedDB)
  useEffect(() => {
    async function loadBook() {
      if (!bookId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/reading/${bookId}`);
        if (!res.ok) {
          toast.error("Livro não encontrado.");
          router.push("/reading");
          return;
        }
        const data: BookData = await res.json();

        // Fallback para cache local se fileUrl não veio do backend
        if (!data.fileUrl && typeof window !== "undefined") {
          const localUrl = localStorage.getItem(`ebook_file_${bookId}`);
          const localFormat = localStorage.getItem(`ebook_format_${bookId}`);
          if (localUrl) {
            data.fileUrl = localUrl;
            if (localFormat) data.fileFormat = localFormat as any;
          }
        }

        setBook(data);

        // Resolve arquivo: se for IndexedDB local, extrai o Blob
        if (data.fileUrl?.startsWith("idb:")) {
          const blob = await getEbookFromIndexedDB(data.fileUrl);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            setResolvedUrl(blobUrl);
          } else {
            toast.error("Arquivo local não encontrado neste navegador.");
          }
        } else if (data.fileUrl) {
          setResolvedUrl(data.fileUrl);
        }

        // Restaura localização salva (do banco ou do cache local)
        const localCached = localStorage.getItem(`reading_loc_${bookId}`);
        const savedLoc = localCached || data.currentLocation || null;
        setCurrentLocation(savedLoc);
        setProgress(data.progress || 0);

        if (data.readingSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.readingSettings });
        }
      } catch (err: any) {
        toast.error("Erro ao carregar livro.");
        router.push("/reading");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [bookId, router]);

  const [attachingFile, setAttachingFile] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  const handleDirectAttach = async (file: File) => {
    if (!file || !bookId) return;
    const name = file.name.toLowerCase();
    let detectedFormat: "pdf" | "epub" | null = null;
    if (name.endsWith(".pdf")) detectedFormat = "pdf";
    else if (name.endsWith(".epub")) detectedFormat = "epub";

    if (!detectedFormat) {
      toast.error("Por favor envie um arquivo .pdf ou .epub.");
      return;
    }

    setAttachingFile(true);
    try {
      let finalUrl = "";
      let finalFormat: "pdf" | "epub" = detectedFormat;
      let finalSize = file.size;

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/reading/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            finalUrl = data.url;
            if (data.format) finalFormat = data.format;
            if (data.size) finalSize = data.size;
          }
        }
      } catch (uploadErr) {
        console.warn("Upload falhou no servidor, usando IndexedDB local:", uploadErr);
      }

      if (!finalUrl) {
        const safeId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        finalUrl = await saveEbookToIndexedDB(safeId, file);
      }

      // Persiste no backend
      await fetch(`/api/reading/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: finalUrl,
          fileFormat: finalFormat,
          fileSize: finalSize,
        }),
      });

      // Salva no cache local do navegador
      localStorage.setItem(`ebook_file_${bookId}`, finalUrl);
      localStorage.setItem(`ebook_format_${bookId}`, finalFormat);

      // Resolve a URL para o visualizador
      if (finalUrl.startsWith("idb:")) {
        const blob = await getEbookFromIndexedDB(finalUrl);
        if (blob) {
          setResolvedUrl(URL.createObjectURL(blob));
        }
      } else {
        setResolvedUrl(finalUrl);
      }

      setBook((prev) => (prev ? { ...prev, fileUrl: finalUrl, fileFormat: finalFormat, fileSize: finalSize } : null));
      toast.success("eBook anexado com sucesso! Iniciando leitura...");
    } catch (err: any) {
      toast.error("Erro ao carregar arquivo de leitura.");
    } finally {
      setAttachingFile(false);
    }
  };

  // 2. Auto-save com debounce de 1.5s
  const syncProgressToBackend = useCallback(
    (newLocation: string, newPercentage: number, pageNumber?: number) => {
      if (!bookId) return;

      // Salva instantaneamente no cache local
      localStorage.setItem(`reading_loc_${bookId}`, newLocation);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const payload: any = {
            currentLocation: newLocation,
            progress: Math.round(newPercentage * 100),
          };

          if (pageNumber && pageNumber > 0) {
            payload.currentPage = pageNumber;
          }

          if (newPercentage >= 0.99) {
            payload.status = "COMPLETED";
          } else {
            payload.status = "READING";
          }

          await fetch(`/api/reading/${bookId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.warn("Falha silenciosa ao sincronizar progresso:", e);
        }
      }, 1500);
    },
    [bookId]
  );

  // 3. Atualiza configurações de leitura (tema/fonte) e persiste
  const updateSettings = (partial: Partial<BookReadingSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);

    // Persiste preferências no banco
    if (bookId) {
      fetch(`/api/reading/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingSettings: updated }),
      }).catch(() => {});
    }
  };

  // 4. Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco estiver em algum input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        readerRef.current?.nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        readerRef.current?.prevPage();
      } else if (e.key === "Escape") {
        setShowToc(false);
        setShowSettings(false);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Cores de fundo do container de acordo com o tema selecionado
  const getContainerBg = () => {
    switch (settings.theme) {
      case "light":
        return "bg-white text-zinc-900";
      case "sepia":
        return "bg-[#FBF0D9] text-[#433422]";
      case "black":
        return "bg-black text-zinc-300";
      case "dark":
      default:
        return "bg-zinc-950 text-zinc-100";
    }
  };

  if (loading || !book) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <h2 className="text-base font-bold text-foreground">Abrindo seu livro...</h2>
        <p className="text-xs text-muted-foreground">Recuperando de onde você parou.</p>
      </div>
    );
  }

  if (!book.fileUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center bg-background space-y-5">
        <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
          <BookOpen className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-black text-foreground">{book.title}</h2>
          <p className="text-xs text-muted-foreground">
            Este livro ainda não possui um arquivo digital (PDF ou EPUB) anexado para leitura na aplicação.
          </p>
        </div>

        <div className="p-6 rounded-2xl border-2 border-dashed border-amber-500/40 bg-card/60 backdrop-blur-md max-w-md w-full space-y-4">
          <input
            ref={directFileInputRef}
            type="file"
            accept=".pdf,.epub"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleDirectAttach(f);
            }}
          />

          <button
            type="button"
            disabled={attachingFile}
            onClick={() => directFileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            {attachingFile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando arquivo...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                <span>Carregar Arquivo (PDF ou EPUB) Agora</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground">
            Formatos suportados: PDF (.pdf) e EPUB (.epub)
          </p>
        </div>

        <Link
          href="/reading"
          className="px-5 py-2.5 rounded-xl border border-border/70 hover:bg-muted text-muted-foreground font-semibold text-xs inline-flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar para a Estante</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden transition-colors duration-300 ${getContainerBg()}`}>
      {/* ── TOPBAR RETRÁTIL DO LEITOR DIGITAL ── */}
      <header
        className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-300 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between shadow-sm ${
          showBars ? "translate-y-0" : "-translate-y-full"
        } ${
          settings.theme === "light"
            ? "bg-white/90 border-zinc-200 text-zinc-800"
            : settings.theme === "sepia"
            ? "bg-[#F3E7CA]/95 border-[#E6D4B2] text-[#433422]"
            : "bg-zinc-900/90 border-zinc-800 text-zinc-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/reading"
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Voltar para a estante"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Estante</span>
          </Link>

          <div className="h-4 w-px bg-current opacity-20" />

          <div className="max-w-[200px] sm:max-w-xs md:max-w-md truncate">
            <h1 className="text-xs sm:text-sm font-bold truncate">{book.title}</h1>
            <p className="text-[10px] opacity-70 truncate">{book.author || "Autor não informado"}</p>
          </div>
        </div>

        {/* Controles do Cabeçalho */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Botão Sumário (TOC) */}
          <button
            onClick={() => {
              setShowToc(!showToc);
              setShowSettings(false);
            }}
            className={`p-2 rounded-xl transition-all ${
              showToc
                ? "bg-amber-500/20 text-amber-500 font-bold"
                : "hover:bg-black/10 dark:hover:bg-white/10"
            }`}
            title="Índice / Capítulos"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Botão de Preferências Tipográficas [Aa] */}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowToc(false);
            }}
            className={`px-2.5 py-1.5 rounded-xl font-serif text-sm font-bold flex items-center gap-1 transition-all ${
              showSettings
                ? "bg-amber-500/20 text-amber-500"
                : "hover:bg-black/10 dark:hover:bg-white/10"
            }`}
            title="Aparência e Fonte"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Aa</span>
          </button>

          {/* Alternar Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors hidden sm:block"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── PAINEL POPOVER DE APARÊNCIA [Aa] ── */}
      {showSettings && (
        <div
          className={`absolute top-16 right-4 z-50 w-80 rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${
            settings.theme === "light"
              ? "bg-white/98 border-zinc-200 text-zinc-900"
              : settings.theme === "sepia"
              ? "bg-[#F7EED9]/98 border-[#E6D4B2] text-[#433422]"
              : "bg-zinc-900/98 border-zinc-800 text-zinc-100"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-current/10">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Aparência da Leitura</span>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Seletor de Temas */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-75">Tema de Cor</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "light", label: "Claro", bg: "bg-white", border: "border-zinc-300", text: "text-zinc-900" },
                { id: "sepia", label: "Sépia", bg: "bg-[#FBF0D9]", border: "border-[#E6D4B2]", text: "text-[#433422]" },
                { id: "dark", label: "Escuro", bg: "bg-zinc-900", border: "border-zinc-700", text: "text-zinc-100" },
                { id: "black", label: "OLED", bg: "bg-black", border: "border-zinc-800", text: "text-zinc-300" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id as any })}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${t.bg} ${t.border} ${t.text} ${
                    settings.theme === t.id ? "ring-2 ring-amber-500 scale-102 shadow-sm" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <span>{t.label}</span>
                  {settings.theme === t.id && <Check className="w-3 h-3 text-amber-500 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tamanho da Fonte */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold opacity-75">
              <span>Tamanho da Fonte</span>
              <span>{settings.fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings({ fontSize: Math.max((settings.fontSize || 18) - 2, 12) })}
                className="flex-1 py-1.5 rounded-xl border border-current/20 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold"
              >
                A-
              </button>
              <button
                onClick={() => updateSettings({ fontSize: Math.min((settings.fontSize || 18) + 2, 32) })}
                className="flex-1 py-1.5 rounded-xl border border-current/20 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold"
              >
                A+
              </button>
            </div>
          </div>

          {/* Família Tipográfica */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-75">Tipografia</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "serif", label: "Serifada", font: "font-serif" },
                { id: "sans", label: "Sem Serifa", font: "font-sans" },
                { id: "mono", label: "Mono", font: "font-mono" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => updateSettings({ fontFamily: f.id as any })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${f.font} ${
                    settings.fontFamily === f.id
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                      : "border-current/15 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Espaçamento entre Linhas */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-75">Espaçamento</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { val: 1.4, label: "Pequeno" },
                { val: 1.6, label: "Médio" },
                { val: 1.8, label: "Grande" },
              ].map((lh) => (
                <button
                  key={lh.val}
                  onClick={() => updateSettings({ lineHeight: lh.val })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    settings.lineHeight === lh.val
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                      : "border-current/15 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  {lh.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── GAVETA LATERAL DO SUMÁRIO (TOC) ── */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay de fundo para fechar ao clicar fora */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowToc(false)}
          />

          <aside
            className={`relative w-80 max-w-full h-full shadow-2xl border-r p-5 flex flex-col z-10 transition-transform duration-300 ${
              settings.theme === "light"
                ? "bg-white border-zinc-200 text-zinc-900"
                : settings.theme === "sepia"
                ? "bg-[#F7EED9] border-[#E6D4B2] text-[#433422]"
                : "bg-zinc-900 border-zinc-800 text-zinc-100"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-current/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold">Sumário do Livro</h2>
              </div>
              <button
                onClick={() => setShowToc(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              {toc.length === 0 ? (
                <div className="p-6 text-center opacity-60 text-xs">
                  Este livro não possui índice de capítulos interativo.
                </div>
              ) : (
                toc.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (book.fileFormat === "pdf" && item.page) {
                        readerRef.current?.goToPage?.(item.page);
                      } else if (readerRef.current?.goToLocation) {
                        readerRef.current.goToLocation(item.target);
                      }
                      setShowToc(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{item.title}</span>
                    {item.page && <span className="text-[10px] opacity-50 font-mono">p. {item.page}</span>}
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ── ÁREA CENTRAL DE LEITURA ── */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Zona clicável esquerda (Voltar página) */}
        <div
          onClick={() => readerRef.current?.prevPage()}
          className="absolute left-0 top-16 bottom-16 w-16 sm:w-24 z-30 cursor-pointer flex items-center justify-start pl-2 group"
          title="Página Anterior (Seta Esquerda)"
        >
          <div className="p-2 rounded-full bg-black/30 dark:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-md">
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Zona de clique central para alternar barras de ferramentas */}
        <div
          onClick={() => setShowBars(!showBars)}
          className="absolute inset-x-24 top-16 bottom-16 z-20 cursor-default"
        />

        {/* Renderizador Selecionado (EPUB ou PDF) */}
        <div className="w-full h-full">
          {book.fileFormat === "epub" ? (
            <EpubReader
              url={resolvedUrl || book.fileUrl}
              initialLocation={currentLocation}
              settings={settings}
              readerRef={readerRef}
              onLocationChange={({ cfi, percentage, pageInfo: pInfo }) => {
                setCurrentLocation(cfi);
                setProgress(percentage);
                if (pInfo) setPageInfo(pInfo);
                syncProgressToBackend(cfi, percentage);
              }}
              onTocLoaded={(rawToc) => {
                const flat: Array<{ title: string; target: string }> = [];
                const parse = (items: any[]) => {
                  for (const it of items) {
                    flat.push({ title: it.label?.trim() || "Capítulo", target: it.href });
                    if (it.subitems) parse(it.subitems);
                  }
                };
                parse(rawToc);
                setToc(flat);
              }}
            />
          ) : (
            <PdfReader
              url={resolvedUrl || book.fileUrl}
              initialPage={
                currentLocation && !isNaN(Number(currentLocation))
                  ? Number(currentLocation)
                  : book.currentPage > 0
                  ? book.currentPage
                  : 1
              }
              settings={settings}
              readerRef={readerRef}
              onPageChange={(page, total, percentage) => {
                setCurrentLocation(String(page));
                setProgress(percentage);
                setPageInfo(`Página ${page} de ${total}`);
                syncProgressToBackend(String(page), percentage, page);
              }}
              onOutlineLoaded={(outline) => {
                setToc(
                  outline.map((o) => ({
                    title: o.title,
                    target: String(o.pageNumber || 1),
                    page: o.pageNumber,
                  }))
                );
              }}
            />
          )}
        </div>

        {/* Zona clicável direita (Avançar página) */}
        <div
          onClick={() => readerRef.current?.nextPage()}
          className="absolute right-0 top-16 bottom-16 w-16 sm:w-24 z-30 cursor-pointer flex items-center justify-end pr-2 group"
          title="Próxima Página (Seta Direita ou Espaço)"
        >
          <div className="p-2 rounded-full bg-black/30 dark:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-md">
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </main>

      {/* ── BOTTOMBAR RETRÁTIL COM BARRA DE PROGRESSO ── */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 backdrop-blur-xl border-t px-6 py-2.5 flex flex-col gap-1.5 shadow-md ${
          showBars ? "translate-y-0" : "translate-y-full"
        } ${
          settings.theme === "light"
            ? "bg-white/90 border-zinc-200 text-zinc-800"
            : settings.theme === "sepia"
            ? "bg-[#F3E7CA]/95 border-[#E6D4B2] text-[#433422]"
            : "bg-zinc-900/90 border-zinc-800 text-zinc-100"
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-bold opacity-80">
          <span>{pageInfo || `Progresso do Livro`}</span>
          <span className="font-mono">{Math.round(progress * 100)}% lido</span>
        </div>

        {/* Linha de progresso */}
        <div className="w-full h-1.5 rounded-full bg-current/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${Math.min(Math.max(progress * 100, 0), 100)}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
