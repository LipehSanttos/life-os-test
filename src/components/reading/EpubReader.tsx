"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";

import { BookReadingSettings } from "@/types";

export interface TocItem {
  id?: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

export interface EpubReaderProps {
  url: string;
  initialLocation?: string | null;
  settings: Required<BookReadingSettings>;
  onLocationChange: (loc: { cfi: string; percentage: number; pageInfo?: string }) => void;
  onTocLoaded?: (toc: TocItem[]) => void;
  readerRef?: React.MutableRefObject<{
    nextPage: () => void;
    prevPage: () => void;
    goToLocation?: (target: string) => void;
    goToPage?: (page: number) => void;
  } | null>;
}

const THEME_STYLES: Record<string, { bg: string; text: string }> = {
  light: { bg: "#FFFFFF", text: "#18181B" },
  sepia: { bg: "#FBF0D9", text: "#433422" },
  dark: { bg: "#18181B", text: "#E4E4E7" },
  black: { bg: "#000000", text: "#A1A1AA" },
};

const FONT_MAP: Record<string, string> = {
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export default function EpubReader({
  url,
  initialLocation,
  settings,
  onLocationChange,
  onTocLoaded,
  readerRef,
}: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expõe métodos de navegação através do readerRef
  useEffect(() => {
    if (readerRef) {
      readerRef.current = {
        nextPage: () => {
          if (renditionRef.current) renditionRef.current.next();
        },
        prevPage: () => {
          if (renditionRef.current) renditionRef.current.prev();
        },
        goToLocation: (target: string) => {
          if (renditionRef.current) renditionRef.current.display(target);
        },
      };
    }
  }, [readerRef]);

  // Inicializa o epubjs
  useEffect(() => {
    let isCancelled = false;

    async function initEpub() {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        // Importação dinâmica para evitar quebra no SSR do Next.js
        const ePubModule = await import("epubjs");
        const ePub = (ePubModule as any).default || ePubModule;

        if (isCancelled) return;

        // Limpa container caso já tenha conteúdo
        containerRef.current.innerHTML = "";

        const book = ePub(url);
        bookRef.current = book;

        const rendition = book.renderTo(containerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "none",
        });
        renditionRef.current = rendition;

        // Registrar temas
        Object.entries(THEME_STYLES).forEach(([name, { bg, text }]) => {
          rendition.themes.register(name, {
            body: {
              background: `${bg} !important`,
              color: `${text} !important`,
              "font-family": `${FONT_MAP[settings.fontFamily]} !important`,
              "line-height": `${settings.lineHeight} !important`,
              padding: "0 2rem !important",
            },
            "p, span, div, h1, h2, h3, h4, h5, h6, a, li": {
              color: `${text} !important`,
              "font-family": `${FONT_MAP[settings.fontFamily]} !important`,
              "line-height": `${settings.lineHeight} !important`,
            },
          });
        });

        rendition.themes.select(settings.theme);
        rendition.themes.fontSize(`${settings.fontSize}px`);

        // Carrega navegação / TOC
        book.loaded.navigation.then((nav: any) => {
          if (!isCancelled && onTocLoaded && nav?.toc) {
            onTocLoaded(nav.toc);
          }
        });

        // Gera posições para cálculo de porcentagem exata
        book.ready.then(() => {
          return book.locations.generate(1000);
        });

        // Evento ao trocar de página
        rendition.on("relocated", (location: any) => {
          if (isCancelled) return;
          const startCfi = location.start.cfi;
          let percentage = 0;

          try {
            if (book.locations && book.locations.length() > 0) {
              percentage = book.locations.percentageFromCfi(startCfi);
            } else if (location.start.percentage) {
              percentage = location.start.percentage;
            }
          } catch (e) {
            // fallback
          }

          const pageInfo = location.start.displayed
            ? `Página ${location.start.displayed.page} de ${location.start.displayed.total}`
            : undefined;

          onLocationChange({
            cfi: startCfi,
            percentage: Math.min(Math.max(percentage, 0), 1),
            pageInfo,
          });
        });

        // Exibe na posição salva ou no início
        await rendition.display(initialLocation || undefined);
        if (!isCancelled) setLoading(false);
      } catch (err: any) {
        console.error("Erro ao carregar EPUB:", err);
        if (!isCancelled) {
          setError(err.message || "Não foi possível renderizar o arquivo EPUB.");
          setLoading(false);
        }
      }
    }

    initEpub();

    return () => {
      isCancelled = true;
      try {
        if (renditionRef.current) renditionRef.current.destroy();
        if (bookRef.current) bookRef.current.destroy();
      } catch (e) {
        // silencia limpeza
      }
    };
  }, [url]);

  // Atualiza tema e tipografia dinamicamente
  useEffect(() => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.themes.select(settings.theme);
      renditionRef.current.themes.fontSize(`${settings.fontSize}px`);
      renditionRef.current.themes.override(
        "font-family",
        FONT_MAP[settings.fontFamily] || FONT_MAP.serif
      );
      renditionRef.current.themes.override("line-height", String(settings.lineHeight));
    } catch (e) {
      console.warn("Erro ao atualizar temas no EPUB:", e);
    }
  }, [settings]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 backdrop-blur-xs bg-background/50">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-semibold text-muted-foreground">Carregando livro...</span>
        </div>
      )}

      {error && (
        <div className="p-8 text-center max-w-md space-y-3 z-20">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h4 className="text-base font-bold text-foreground">Falha ao abrir o eBook</h4>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Container onde o epub.js renderiza o iframe */}
      <div
        ref={containerRef}
        className="w-full h-full max-w-4xl mx-auto px-2 md:px-6"
        style={{
          backgroundColor: THEME_STYLES[settings.theme]?.bg,
          color: THEME_STYLES[settings.theme]?.text,
        }}
      />
    </div>
  );
}
