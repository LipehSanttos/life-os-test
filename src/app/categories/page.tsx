"use client";

import React, { useState, useEffect } from "react";
import { Tags, Plus, Trash2, AlertCircle } from "lucide-react";
import { CategoryData } from "@/types";
import { toast } from "sonner";

/**
 * Página de Gestão de Categorias de Vida do Life OS.
 * Permite listar, criar e excluir categorias com isolamento completo por usuário,
 * garantindo que a exclusão de qualquer categoria não interfira nas contas de outros usuários.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ef4444");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error("Falha ao carregar categorias:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao criar categoria.");
      }

      toast.success("Categoria criada com sucesso!");
      setName("");
      setColor("#ef4444");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar categoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir categoria.");
      }

      toast.success(`Categoria "${categoryToDelete.name}" excluída com sucesso!`);
      setCategoryToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Falha ao excluir categoria.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl border border-border/30 bg-card/60 backdrop-blur-xl glow-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
            <Tags className="w-5 h-5 text-red-400" />
            <span>Estruturação</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            <span className="text-gradient">Categorias de Vida</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-medium">
            Agrupe tarefas, compromissos e metas por áreas temáticas personalizadas.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary hover:bg-primary/90 glow-border-hover text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 active:scale-95 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl">
            <Tags className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-bold text-foreground">Nenhuma categoria ativa</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Crie uma nova categoria personalizada usando o botão acima.
            </p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="p-5 rounded-xl border border-border/30 bg-card/60 backdrop-blur-xl glow-border-hover flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs group-hover:scale-125 transition-transform"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="overflow-hidden">
                  <span className="font-bold text-base text-foreground block truncate">{cat.name}</span>
                  <span className="text-xs text-muted-foreground font-medium block">
                    {cat._count?.tasks || 0} tarefas vinculadas
                  </span>
                </div>
              </div>

              {/* Botão de Excluir Categoria */}
              <button
                type="button"
                onClick={() => setCategoryToDelete(cat)}
                className="p-2 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/15 active:scale-95 transition-all flex-shrink-0 ml-2"
                title={`Excluir categoria ${cat.name}`}
                aria-label={`Excluir categoria ${cat.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal: Nova Categoria */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border/30 bg-card/95 backdrop-blur-2xl p-6 sm:p-8 space-y-4 glow-border shadow-2xl">
            <h2 className="text-xl font-black text-foreground">Nova Categoria</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Nome da Categoria *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Saúde & Bem-estar"
                  className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background/80 text-foreground text-sm outline-none input-glow font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Cor Temática</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-12 rounded-lg border border-border/40 bg-background cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 glow-border-hover text-primary-foreground font-black text-sm shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Excluir Categoria */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-5 shadow-2xl glow-border">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Excluir Categoria</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Isolamento exclusivo para o seu perfil
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: categoryToDelete.color }}
                />
                <span className="font-bold text-sm text-foreground">{categoryToDelete.name}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tem certeza de que deseja remover esta categoria da sua conta? Suas tarefas vinculadas serão mantidas com segurança sem categoria. Esta ação <strong>não afetará nenhum outro usuário</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
