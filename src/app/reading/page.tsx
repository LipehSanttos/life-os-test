"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  BookMarked,
  Search,
  Sparkles,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Edit3,
  BookmarkPlus,
  ExternalLink,
  BookCopy,
  Link as LinkIcon,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { BookData } from "@/types";
import { toast } from "sonner";
import { saveEbookToIndexedDB } from "@/lib/ebookStorage";

export default function ReadingPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookData[]>([]);
  const [activeTab, setActiveTab] = useState<"ebooks" | "shelf">("ebooks");
  const [isDragging, setIsDragging] = useState(false);
  const [quickUploading, setQuickUploading] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);

  // Form State
  const [isbnSearch, setIsbnSearch] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverTab, setCoverTab] = useState<"upload" | "url">("upload");
  const [totalPages, setTotalPages] = useState(250);
  const [currentPage, setCurrentPage] = useState(0);

  // eBook file upload state
  const [fileUrl, setFileUrl] = useState("");
  const [fileFormat, setFileFormat] = useState<"pdf" | "epub" | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploadingEbook, setUploadingEbook] = useState(false);

  const [loading, setLoading] = useState(false);
  const [searchingIsbn, setSearchingIsbn] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [manualPages, setManualPages] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const ebookInputRef = useRef<HTMLInputElement>(null);
  const editEbookInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/reading");
      if (res.ok) {
        const rawBooks: BookData[] = await res.json();
        const enriched = rawBooks.map((b) => {
          if (!b.fileUrl && typeof window !== "undefined") {
            const locUrl = localStorage.getItem(`ebook_file_${b.id}`);
            const locFmt = localStorage.getItem(`ebook_format_${b.id}`);
            if (locUrl) {
              return { ...b, fileUrl: locUrl, fileFormat: (locFmt as any) || b.fileFormat };
            }
          }
          return b;
        });
        setBooks(enriched);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "shelf") {
        setActiveTab("shelf");
      } else if (tabParam === "ebooks") {
        setActiveTab("ebooks");
      }
    }
  }, []);

  // Quick upload para carregar eBook com 1 clique diretamente na aba de eBooks
  const handleQuickEbookUpload = async (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    let detectedFormat: "pdf" | "epub" | null = null;
    if (name.endsWith(".pdf")) detectedFormat = "pdf";
    else if (name.endsWith(".epub")) detectedFormat = "epub";

    if (!detectedFormat) {
      toast.error("Formato inválido. Por favor envie um arquivo .pdf ou .epub.");
      return;
    }

    setQuickUploading(true);
    try {
      let finalUrl = "";
      let finalFormat: "pdf" | "epub" = detectedFormat;
      let finalSize = file.size;

      // 1. Tenta upload via API
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
      } catch (upErr) {
        console.warn("[upload] Falha no servidor, usando armazenamento local:", upErr);
      }

      // 2. Fallback garantido no IndexedDB caso servidor não grave
      if (!finalUrl) {
        const safeId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        finalUrl = await saveEbookToIndexedDB(safeId, file);
      }

      // Nome limpo para o título
      const cleanTitle = file.name
        .replace(/\.(pdf|epub)$/i, "")
        .replace(/[_-]/g, " ")
        .trim();

      // 3. Cadastra o livro no banco de dados
      const createRes = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle || "eBook sem título",
          fileUrl: finalUrl,
          fileFormat: finalFormat,
          fileSize: finalSize,
          totalPages: 100,
          currentPage: 0,
          progress: 0,
          status: "READING",
        }),
      });

      if (!createRes.ok) throw new Error("Erro ao registrar livro na biblioteca.");
      const createdBook: BookData = await createRes.json();

      // Persiste no cache local do navegador
      if (typeof window !== "undefined") {
        localStorage.setItem(`ebook_file_${createdBook.id}`, finalUrl);
        localStorage.setItem(`ebook_format_${createdBook.id}`, finalFormat);
      }

      await loadData();

      toast.success(`eBook "${cleanTitle}" pronto para leitura!`, {
        action: {
          label: "Ler Agora",
          onClick: () => router.push(`/reading/${createdBook.id}/read`),
        },
      });
    } catch (err: any) {
      console.error("Erro no carregamento rápido:", err);
      toast.error(err.message || "Erro ao carregar eBook.");
    } finally {
      setQuickUploading(false);
    }
  };

  // Search by ISBN or Title via Google Books & Open Library
  const handleSearchIsbn = async () => {
    if (!isbnSearch.trim()) {
      toast.error("Digite um ISBN ou título para buscar.");
      return;
    }

    setSearchingIsbn(true);
    try {
      const res = await fetch(`/api/books/isbn?isbn=${encodeURIComponent(isbnSearch.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        toast.info(data.message || "Livro não encontrado automaticamente. Preencha os dados abaixo.");
        return;
      }

      setTitle(data.title || "");
      if (data.author) setAuthor(data.author);
      if (data.totalPages) setTotalPages(data.totalPages);
      if (data.isbn) setIsbn(data.isbn);
      if (data.coverUrl) setCoverUrl(data.coverUrl);

      toast.success(`Encontrado: "${data.title}"! Capa e detalhes carregados.`);
    } catch (err: any) {
      toast.error("Erro ao buscar dados do livro.");
    } finally {
      setSearchingIsbn(false);
    }
  };

  // Upload image file from computer
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Fallback to FileReader base64 if server upload encounters issue
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCoverUrl(e.target.result as string);
            toast.success("Imagem carregada com sucesso!");
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      setCoverUrl(data.url);
      toast.success("Capa enviada com sucesso.");
    } catch (err: any) {
      // Fallback to base64 Data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCoverUrl(e.target.result as string);
          toast.success("Imagem carregada localmente.");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload eBook file (.pdf or .epub) com suporte a Supabase Storage e IndexedDB local
  const handleEbookUpload = async (file: File, isEdit: boolean = false) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    let detectedFormat: "pdf" | "epub" | null = null;
    if (name.endsWith(".pdf")) detectedFormat = "pdf";
    else if (name.endsWith(".epub")) detectedFormat = "epub";

    if (!detectedFormat) {
      toast.error("Formato inválido. Por favor envie um arquivo .pdf ou .epub.");
      return;
    }

    setUploadingEbook(true);
    try {
      let finalUrl = "";
      let finalFormat: "pdf" | "epub" = detectedFormat;
      let finalSize = file.size;

      // 1. Tenta upload via API do servidor (Supabase Storage / local)
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
      } catch (uploadNetErr) {
        console.warn("[upload] Falha no servidor, ativando fallback IndexedDB:", uploadNetErr);
      }

      // 2. Se o servidor falhou ou retornou 500, salva diretamente no IndexedDB do navegador
      if (!finalUrl) {
        const safeId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        finalUrl = await saveEbookToIndexedDB(safeId, file);
        toast.success(`eBook "${file.name}" salvo no armazenamento local do navegador!`);
      } else {
        toast.success(`eBook "${file.name}" enviado com sucesso!`);
      }

      setFileUrl(finalUrl);
      setFileFormat(finalFormat);
      setFileSize(finalSize);

      // Preenche o título automaticamente se estiver em branco
      if (!isEdit && !title.trim()) {
        const cleanTitle = file.name
          .replace(/\.(pdf|epub)$/i, "")
          .replace(/[_-]/g, " ")
          .trim();
        setTitle(cleanTitle);
      }
    } catch (err: any) {
      console.error("Erro no processamento do eBook:", err);
      toast.error(err.message || "Erro no upload do arquivo.");
    } finally {
      setUploadingEbook(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("O título do livro é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || null,
          isbn: isbn.trim() || null,
          coverUrl: coverUrl.trim() || null,
          totalPages: Number(totalPages) || 100,
          fileUrl: fileUrl.trim() || null,
          fileFormat: fileFormat || null,
          fileSize: fileSize || null,
        }),
      });

      if (!res.ok) throw new Error("Erro ao adicionar livro.");
      const createdBook = await res.json();

      if (fileUrl && typeof window !== "undefined") {
        localStorage.setItem(`ebook_file_${createdBook.id}`, fileUrl);
        if (fileFormat) localStorage.setItem(`ebook_format_${createdBook.id}`, fileFormat);
      }

      toast.success("Livro adicionado à sua biblioteca com sucesso.");
      resetForm();
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar livro.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    setLoading(true);
    try {
      const nextProgress = Math.min(Math.round((currentPage / totalPages) * 100), 100);
      const res = await fetch(`/api/reading/${selectedBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || null,
          isbn: isbn.trim() || null,
          coverUrl: coverUrl.trim() || null,
          totalPages: Number(totalPages),
          currentPage: Number(currentPage),
          progress: nextProgress,
          status: nextProgress === 100 ? "COMPLETED" : "READING",
          fileUrl: fileUrl.trim() || null,
          fileFormat: fileFormat || null,
          fileSize: fileSize || null,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar livro.");

      if (fileUrl && typeof window !== "undefined") {
        localStorage.setItem(`ebook_file_${selectedBook.id}`, fileUrl);
        if (fileFormat) localStorage.setItem(`ebook_format_${selectedBook.id}`, fileFormat);
      }

      toast.success("Livro atualizado com sucesso.");
      setEditModalOpen(false);
      setSelectedBook(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar edições.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este livro da sua biblioteca?")) return;

    try {
      await fetch(`/api/reading/${id}`, { method: "DELETE" });
      toast.success("Livro removido da biblioteca.");
      loadData();
    } catch {
      toast.error("Erro ao excluir livro.");
    }
  };

  const handleAddPages = async (book: BookData, count: number) => {
    const nextPages = Math.min(book.currentPage + count, book.totalPages);
    const nextProgress = Math.round((nextPages / book.totalPages) * 100);

    try {
      await fetch(`/api/reading/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPage: nextPages,
          progress: nextProgress,
          status: nextProgress === 100 ? "COMPLETED" : "READING",
        }),
      });

      toast.success(`Progresso registrado: +${count} páginas.`);
      loadData();
    } catch {
      toast.error("Erro ao registrar leitura.");
    }
  };

  const handleManualAdd = (book: BookData) => {
    const rawVal = manualPages[book.id];
    if (!rawVal) return;
    const count = parseInt(rawVal, 10);
    if (isNaN(count) || count <= 0) {
      toast.error("Informe uma quantidade válida de páginas.");
      return;
    }
    handleAddPages(book, count);
    setManualPages((prev) => ({ ...prev, [book.id]: "" }));
  };

  const openEditModal = (book: BookData) => {
    setSelectedBook(book);
    setTitle(book.title);
    setAuthor(book.author || "");
    setIsbn(book.isbn || "");
    setCoverUrl(book.coverUrl || "");
    setCoverTab("upload");
    setTotalPages(book.totalPages);
    setCurrentPage(book.currentPage);
    setFileUrl(book.fileUrl || "");
    setFileFormat(book.fileFormat || null);
    setFileSize(book.fileSize || null);
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setIsbnSearch("");
    setTitle("");
    setAuthor("");
    setIsbn("");
    setCoverUrl("");
    setCoverTab("upload");
    setTotalPages(250);
    setCurrentPage(0);
    setFileUrl("");
    setFileFormat(null);
    setFileSize(null);
  };

  const ebooksList = books.filter(
    (b) => Boolean(b.fileUrl) || (typeof window !== "undefined" && Boolean(localStorage.getItem(`ebook_file_${b.id}`)))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider mb-2">
            <BookMarked className="w-5 h-5" />
            <span>Biblioteca Digital & Leitor de eBooks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            Leitura & Livros
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-medium">
            Carregue seus eBooks (PDF ou EPUB) para ler no Life OS com paginação e progresso contínuo ou organize sua estante.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/25 active:scale-95 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Livro</span>
        </button>
      </div>

      {/* ABA DE NAVEGAÇÃO / TABS SWITCHER */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-card/60 border border-border/70 rounded-2xl w-fit backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab("ebooks")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "ebooks"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📖 Leitor de eBooks</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "ebooks" ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {ebooksList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shelf")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "shelf"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <BookCopy className="w-4 h-4" />
          <span>📚 Todos os Livros / Estante Geral</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "shelf" ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {books.length}
          </span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 1: LEITOR DE EBOOKS (VISUALIZADOR DIGITAL)                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "ebooks" && (
        <div className="space-y-6">
          {/* Quick Dropzone para Carregar eBooks */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleQuickEbookUpload(file);
            }}
            onClick={() => quickFileInputRef.current?.click()}
            className={`relative p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 group overflow-hidden ${
              isDragging
                ? "border-amber-500 bg-amber-500/15 scale-[1.01] shadow-2xl shadow-amber-500/15"
                : "border-amber-500/40 hover:border-amber-500 bg-gradient-to-b from-amber-500/5 via-card/50 to-card/20 hover:bg-amber-500/10"
            }`}
          >
            <input
              ref={quickFileInputRef}
              type="file"
              accept=".pdf,.epub"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleQuickEbookUpload(file);
              }}
            />

            {quickUploading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-500 animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground">Carregando eBook...</h3>
                  <p className="text-xs text-muted-foreground">Configurando o leitor digital e indexando páginas.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-amber-500/15 text-amber-500 group-hover:scale-110 transition-transform shadow-xs">
                  <UploadCloud className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-lg sm:text-xl font-black text-foreground group-hover:text-amber-500 transition-colors">
                    Carregar eBook para Leitura (PDF ou EPUB)
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Arraste e solte o arquivo aqui ou clique para selecionar do seu computador.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-black/40 text-amber-400 border border-amber-500/30 uppercase">
                    PDF (.pdf)
                  </span>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-black/40 text-amber-400 border border-amber-500/30 uppercase">
                    EPUB (.epub)
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Até 50MB
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Grid de eBooks Digitais */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <span>eBooks Prontos para Leitura</span>
                <span className="text-xs text-muted-foreground font-semibold">({ebooksList.length})</span>
              </h2>
            </div>

            {ebooksList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-4">
                <div className="inline-flex p-4 rounded-2xl bg-amber-500/15 text-amber-500 mb-1">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-foreground">Nenhum eBook carregado ainda</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Arraste seu arquivo PDF ou EPUB para o campo acima para iniciar sua leitura no navegador com marcação de página automática.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ebooksList.map((book) => {
                  const isCompleted = book.currentPage >= book.totalPages && book.totalPages > 0;

                  return (
                    <div
                      key={book.id}
                      className="p-5 rounded-3xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all group"
                    >
                      {/* Cover & Header */}
                      <div className="space-y-3.5">
                        <div className="relative w-full h-60 rounded-2xl overflow-hidden bg-muted/60 border border-border/50 flex items-center justify-center shadow-inner group-hover:shadow-md transition-all">
                          {book.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-gradient-to-tr from-amber-500/25 via-primary/10 to-red-500/20">
                              <BookOpen className="w-12 h-12 text-amber-500 mb-2" />
                              <span className="text-xs font-black text-foreground line-clamp-2 px-2">{book.title}</span>
                              <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
                                {book.fileFormat || "eBook"}
                              </span>
                            </div>
                          )}

                          {/* Format Badge */}
                          <div className="absolute top-3 left-3">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-black/80 text-amber-400 border border-amber-500/30 uppercase backdrop-blur-md shadow-xs">
                              {book.fileFormat || "eBook"}
                            </span>
                          </div>

                          {/* Progress Badge */}
                          <div className="absolute top-3 right-3">
                            <span
                              className={`text-xs font-black px-2.5 py-1 rounded-xl backdrop-blur-md shadow-sm border ${
                                isCompleted
                                  ? "bg-emerald-500/90 text-white border-emerald-400"
                                  : "bg-black/60 text-amber-300 border-white/20"
                              }`}
                            >
                              {book.progress}%
                            </span>
                          </div>

                          {/* Quick Edit/Delete */}
                          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1 rounded-xl">
                            <button
                              onClick={() => openEditModal(book)}
                              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
                              title="Editar livro"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(book.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
                              title="Excluir livro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-black text-base text-foreground leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-xs text-muted-foreground font-semibold mt-1 truncate">
                            {book.author || "Autor não informado"}
                          </p>
                        </div>
                      </div>

                      {/* Progress & Botão de Leitura */}
                      <div className="space-y-3 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                          <span>
                            {book.fileFormat === "pdf" ? `Página ${book.currentPage} de ${book.totalPages}` : `${book.progress}% lido`}
                          </span>
                          <span>{isCompleted ? "Concluído" : "Em leitura"}</span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-border/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-400"
                            }`}
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>

                        {/* Botão de Leitura Direta do Livro */}
                        <Link
                          href={`/reading/${book.id}/read`}
                          className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 active:scale-95 transition-all"
                        >
                          <BookOpen className="w-4 h-4 stroke-[2.5]" />
                          <span>{book.progress > 0 ? "Continuar Leitura" : "Iniciar Leitura"}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 2: ESTANTE COMPLETA / LIVROS FÍSICOS                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "shelf" && (
        <div className="space-y-6">
          {books.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-amber-500/15 text-amber-500 mb-2">
                <BookCopy className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-foreground">Sua estante está vazia</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Adicione seus livros favoritos informando o ISBN, enviando a imagem da capa do computador ou digitando os dados manualmente.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Livro</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => {
                const isCompleted = book.currentPage >= book.totalPages;

                return (
                  <div
                    key={book.id}
                    className="p-5 rounded-3xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all group"
                  >
                    {/* Book Cover + Info */}
                    <div className="space-y-3.5">
                      <div className="relative w-full h-60 rounded-2xl overflow-hidden bg-muted/60 border border-border/50 flex items-center justify-center shadow-inner group-hover:shadow-md transition-all">
                        {book.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-gradient-to-tr from-amber-500/20 via-primary/10 to-red-500/20">
                            <BookOpen className="w-12 h-12 text-amber-500/60 mb-2" />
                            <span className="text-xs font-bold text-foreground/80 line-clamp-2">{book.title}</span>
                          </div>
                        )}

                        {/* Format Badge (EPUB / PDF) */}
                        {book.fileFormat && (
                          <div className="absolute top-3 left-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-black/75 text-amber-300 border border-white/20 uppercase backdrop-blur-md shadow-xs">
                              {book.fileFormat}
                            </span>
                          </div>
                        )}

                        {/* Progress Badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-xl backdrop-blur-md shadow-sm border ${
                              isCompleted
                                ? "bg-emerald-500/90 text-white border-emerald-400"
                                : "bg-black/60 text-amber-300 border-white/20"
                            }`}
                          >
                            {book.progress}%
                          </span>
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1 rounded-xl">
                          <button
                            onClick={() => openEditModal(book)}
                            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
                            title="Editar livro"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(book.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
                            title="Excluir livro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-black text-base text-foreground leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-muted-foreground font-semibold mt-1 truncate">
                          {book.author || "Autor não informado"}
                        </p>
                        {book.isbn && (
                          <span className="text-[10px] text-muted-foreground/70 font-mono block mt-0.5">
                            ISBN: {book.isbn}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progresso de Leitura & Ações */}
                    <div className="space-y-3 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                        <span>
                          Página <strong>{book.currentPage}</strong> de {book.totalPages}
                        </span>
                        <span>{isCompleted ? "Concluído" : `${book.totalPages - book.currentPage} restando`}</span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-border/70 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-400"
                          }`}
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>

                      {/* Botão de Leitura do Livro */}
                      {book.fileUrl ? (
                        <Link
                          href={`/reading/${book.id}/read`}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-amber-500/25 active:scale-95 transition-all"
                        >
                          <BookOpen className="w-4 h-4 stroke-[2.5]" />
                          <span>{book.progress > 0 ? "Continuar Leitura" : "Iniciar Leitura"}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditModal(book)}
                          className="w-full py-2 px-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Carregar eBook (PDF/EPUB)</span>
                        </button>
                      )}

                      {/* Quick Action Buttons & Manual Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddPages(book, 1)}
                          disabled={isCompleted}
                          className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all disabled:opacity-40 shrink-0 shadow-xs active:scale-95"
                          title="Adicionar +1 página lida"
                        >
                          +1 pág
                        </button>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleManualAdd(book);
                          }}
                          className="flex-1 flex items-center gap-1"
                        >
                          <input
                            type="number"
                            min="1"
                            max={book.totalPages - book.currentPage}
                            value={manualPages[book.id] || ""}
                            onChange={(e) =>
                              setManualPages((prev) => ({
                                ...prev,
                                [book.id]: e.target.value,
                              }))
                            }
                            placeholder="+ págs lidas"
                            disabled={isCompleted}
                            className="w-full px-3 py-2 rounded-xl border border-border/70 bg-background text-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/40 placeholder:text-muted-foreground/60 transition-all disabled:opacity-40"
                          />
                          <button
                            type="submit"
                            disabled={isCompleted || !manualPages[book.id]}
                            className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 text-xs font-bold transition-all disabled:opacity-40 shrink-0"
                            title="Adicionar páginas lidas"
                          >
                            +
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Adicionar Novo Livro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-500">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Adicionar Novo Livro</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Busque por ISBN, envie a capa do computador ou cole um link
                  </p>
                </div>
              </div>
            </div>

            {/* ISBN Auto Search Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Busca Rápida por ISBN / Título</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={isbnSearch}
                  onChange={(e) => setIsbnSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchIsbn();
                    }
                  }}
                  placeholder="Ex: 9788539004119 ou O Poder do Hábito"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-amber-500/40 font-medium"
                />
                <button
                  type="button"
                  onClick={handleSearchIsbn}
                  disabled={searchingIsbn || !isbnSearch.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{searchingIsbn ? "Buscando..." : "Buscar"}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1.5">Título do Livro *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: O Poder do Hábito"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Autor</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ex: Charles Duhigg"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">ISBN (Opcional)</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="Ex: 9788539004119"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1.5">Total de Páginas</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={totalPages}
                    onChange={(e) => setTotalPages(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Cover Image Selector (Upload File or Paste URL) */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Capa do Livro</span>
                  </label>

                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/50 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCoverTab("upload")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        coverTab === "upload" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Enviar Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverTab("url")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        coverTab === "url" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Colar Link
                    </button>
                  </div>
                </div>

                {coverTab === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5"
                    >
                      <UploadCloud className="w-6 h-6 text-primary animate-bounce" />
                      <span className="text-xs font-bold text-foreground">
                        {uploadingImage ? "Enviando arquivo..." : "Clique para selecionar uma imagem do seu computador"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Suporta PNG, JPG, WEBP até 10MB
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="Cole a URL da imagem (ex: https://exemplo.com/capa.jpg)"
                      className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                    />
                  </div>
                )}

                {/* Cover Live Preview */}
                {coverUrl && (
                  <div className="p-3 rounded-2xl border border-border/60 bg-muted/30 flex items-center gap-4 mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl}
                      alt="Prévia da Capa"
                      className="w-14 h-20 object-cover rounded-lg border border-border/70 shadow-sm"
                    />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground block">Capa Selecionada com Sucesso</span>
                      <span className="text-[11px] truncate block max-w-xs">{coverUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverUrl("")}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
                      title="Remover capa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* eBook File Selector (PDF / EPUB) */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Arquivo do Livro Digital (PDF ou EPUB) - Opcional</span>
                </label>

                <input
                  ref={ebookInputRef}
                  type="file"
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEbookUpload(file, false);
                  }}
                />

                <div
                  onClick={() => ebookInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-amber-500/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5"
                >
                  <UploadCloud className="w-6 h-6 text-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">
                    {uploadingEbook
                      ? "Enviando arquivo de leitura..."
                      : fileUrl
                      ? "Clique para substituir o arquivo digital"
                      : "Clique para selecionar o arquivo PDF ou EPUB do computador"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Formatos suportados: .pdf e .epub até 50MB
                  </span>
                </div>

                {fileUrl && (
                  <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-3 mt-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 font-bold uppercase text-[10px]">
                      {fileFormat || "EBOOK"}
                    </div>
                    <div className="flex-1 text-xs text-muted-foreground truncate">
                      <span className="font-bold text-foreground block">Arquivo de Leitura Pronto</span>
                      <span className="text-[11px] truncate block max-w-xs">{fileUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl("");
                        setFileFormat(null);
                        setFileSize(null);
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
                      title="Remover eBook"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/25 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar Livro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Livro */}
      {editModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/15 text-primary">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Editar Detalhes do Livro</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Atualize o título, páginas lidas, ISBN ou capa
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1.5">Título do Livro *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Autor</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">ISBN</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="Ex: 9788539004119"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Página Atual</label>
                  <input
                    type="number"
                    min="0"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Total de Páginas</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={totalPages}
                    onChange={(e) => setTotalPages(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Cover Image Selector in Edit Modal */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Alterar Capa do Livro</span>
                  </label>

                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/50 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCoverTab("upload")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        coverTab === "upload" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Enviar Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverTab("url")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        coverTab === "url" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Colar Link
                    </button>
                  </div>
                </div>

                {coverTab === "upload" ? (
                  <div>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      className="p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5"
                    >
                      <UploadCloud className="w-6 h-6 text-primary animate-bounce" />
                      <span className="text-xs font-bold text-foreground">
                        {uploadingImage ? "Enviando arquivo..." : "Clique para selecionar nova imagem do computador"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Suporta PNG, JPG, WEBP até 10MB
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="Cole a URL da imagem (ex: https://exemplo.com/capa.jpg)"
                      className="w-full px-4 py-2.5 rounded-xl border border-border/70 bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                    />
                  </div>
                )}

                {/* Cover Live Preview */}
                {coverUrl && (
                  <div className="p-3 rounded-2xl border border-border/60 bg-muted/30 flex items-center gap-4 mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl}
                      alt="Prévia da Capa"
                      className="w-14 h-20 object-cover rounded-lg border border-border/70 shadow-sm"
                    />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground block">Capa Atual</span>
                      <span className="text-[11px] truncate block max-w-xs">{coverUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverUrl("")}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
                      title="Remover capa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* eBook File Selector (PDF / EPUB) in Edit Modal */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Arquivo do Livro Digital (PDF ou EPUB)</span>
                </label>

                <input
                  ref={editEbookInputRef}
                  type="file"
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEbookUpload(file, true);
                  }}
                />

                <div
                  onClick={() => editEbookInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-amber-500/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5"
                >
                  <UploadCloud className="w-6 h-6 text-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">
                    {uploadingEbook
                      ? "Enviando arquivo de leitura..."
                      : fileUrl
                      ? "Clique para substituir o arquivo digital deste livro"
                      : "Clique para anexar arquivo PDF ou EPUB"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Formatos suportados: .pdf e .epub até 50MB
                  </span>
                </div>

                {fileUrl && (
                  <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-3 mt-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 font-bold uppercase text-[10px]">
                      {fileFormat || "EBOOK"}
                    </div>
                    <div className="flex-1 text-xs text-muted-foreground truncate">
                      <span className="font-bold text-foreground block">Arquivo de Leitura Pronto</span>
                      <span className="text-[11px] truncate block max-w-xs">{fileUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl("");
                        setFileFormat(null);
                        setFileSize(null);
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
                      title="Remover eBook"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/25 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
