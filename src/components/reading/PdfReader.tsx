"use client";

import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle } from "lucide-react";

// Configuração do worker do PDF.js via CDN correspondente à versão instalada
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { BookReadingSettings } from "@/types";

export interface PdfOutlineItem {
  title: string;
  dest?: any;
  pageNumber?: number;
  items?: PdfOutlineItem[];
}

export interface PdfReaderProps {
  url: string;
  initialPage?: number;
  settings: Required<BookReadingSettings>;
  onPageChange: (page: number, totalPages: number, percentage: number) => void;
  onOutlineLoaded?: (outline: PdfOutlineItem[]) => void;
  readerRef?: React.MutableRefObject<{
    nextPage: () => void;
    prevPage: () => void;
    goToLocation?: (target: string) => void;
    goToPage?: (page: number) => void;
  } | null>;
}

const THEME_CONTAINER_STYLES: Record<string, { bg: string; filter: string }> = {
  light: { bg: "#F4F4F5", filter: "none" },
  sepia: { bg: "#FBF0D9", filter: "sepia(0.3) contrast(0.95)" },
  dark: { bg: "#18181B", filter: "invert(0.88) hue-rotate(180deg) brightness(0.95)" },
  black: { bg: "#000000", filter: "invert(0.92) hue-rotate(180deg) contrast(1.05)" },
};

export default function PdfReader({
  url,
  initialPage = 1,
  settings,
  onPageChange,
  onOutlineLoaded,
  readerRef,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage || 1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Responsividade: ajusta a largura da página ao container
  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Limita a largura máxima para leitura confortável (máx 900px)
        setContainerWidth(Math.min(width - 32, 900));
      }
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Expõe métodos para o componente pai
  useEffect(() => {
    if (readerRef) {
      readerRef.current = {
        nextPage: () => {
          setPageNumber((prev) => {
            if (numPages > 0 && prev < numPages) return prev + 1;
            return prev;
          });
        },
        prevPage: () => {
          setPageNumber((prev) => {
            if (prev > 1) return prev - 1;
            return prev;
          });
        },
        goToPage: (page: number) => {
          if (page >= 1 && (numPages === 0 || page <= numPages)) {
            setPageNumber(page);
          }
        },
      };
    }
  }, [numPages, readerRef]);

  // Notifica o pai quando a página muda
  useEffect(() => {
    if (numPages > 0) {
      const percentage = (pageNumber - 1) / Math.max(numPages - 1, 1);
      onPageChange(pageNumber, numPages, Math.min(Math.max(percentage, 0), 1));
    }
  }, [pageNumber, numPages]);

  const onDocumentLoadSuccess = async (pdf: any) => {
    pdfDocRef.current = pdf;
    setNumPages(pdf.numPages);
    setLoading(false);
    setError(null);

    // Ajusta página inicial se fornecida e válida
    if (initialPage && initialPage >= 1 && initialPage <= pdf.numPages) {
      setPageNumber(initialPage);
    }

    // Extrai o Outline/Sumário do PDF
    try {
      const outline = await pdf.getOutline();
      if (outline && outline.length > 0 && onOutlineLoaded) {
        // Resolve números de página dos destinos se possível
        const processedOutline: PdfOutlineItem[] = [];
        for (const item of outline) {
          let destPage = 1;
          if (item.dest) {
            try {
              if (typeof item.dest === "string") {
                const destObj = await pdf.getDestination(item.dest);
                if (destObj) {
                  const pageIndex = await pdf.getPageIndex(destObj[0]);
                  destPage = pageIndex + 1;
                }
              } else if (Array.isArray(item.dest)) {
                const pageIndex = await pdf.getPageIndex(item.dest[0]);
                destPage = pageIndex + 1;
              }
            } catch (e) {
              // fallback
            }
          }
          processedOutline.push({
            title: item.title,
            pageNumber: destPage,
            dest: item.dest,
          });
        }
        onOutlineLoaded(processedOutline);
      }
    } catch (e) {
      console.warn("PDF não possui índice interativo:", e);
    }
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("Erro ao carregar PDF:", err);
    setError(err.message || "Erro ao carregar o arquivo PDF.");
    setLoading(false);
  };

  const themeStyle = THEME_CONTAINER_STYLES[settings.theme] || THEME_CONTAINER_STYLES.light;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-y-auto py-6"
      style={{ backgroundColor: themeStyle.bg }}
    >
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 backdrop-blur-xs bg-background/50">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-semibold text-muted-foreground">Carregando PDF...</span>
        </div>
      )}

      {error && (
        <div className="p-8 text-center max-w-md space-y-3 z-20">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h4 className="text-base font-bold text-foreground">Falha ao abrir PDF</h4>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Renderização da Página com filtro temático */}
      <div
        className="transition-all duration-300 rounded-lg shadow-2xl overflow-hidden border border-border/20"
        style={{
          filter: themeStyle.filter,
        }}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            width={containerWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="rounded-lg shadow-sm"
          />
        </Document>
      </div>
    </div>
  );
}
