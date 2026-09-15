"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TaskModal } from "@/components/tasks/TaskModal";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { TaskData } from "@/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReader = pathname?.endsWith("/read");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || !e.key) return;
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (
        key === "n" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setTaskToEdit(null);
        setTaskModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (pathname === "/login") {
    return <main className="h-screen w-screen overflow-y-auto bg-background">{children}</main>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          onOpenTaskModal={() => {
            setTaskToEdit(null);
            setTaskModalOpen(true);
          }}
        />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-64 h-full bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Sidebar
              onOpenTaskModal={() => {
                setTaskToEdit(null);
                setTaskModalOpen(true);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenTaskModal={() => {
            setTaskToEdit(null);
            setTaskModalOpen(true);
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background grain-overlay">
          {children}
        </main>
      </div>

      {/* Botão Flutuante (FAB) Mobile: Nova Tarefa */}
      {!isReader && (
        <button
          onClick={() => {
            setTaskToEdit(null);
            setTaskModalOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 md:hidden flex items-center gap-2 px-4 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-2xl shadow-primary/40 border border-white/20 active:scale-95 transition-all duration-200 group"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
          aria-label="Criar nova tarefa"
          title="Criar nova tarefa"
        >
          <Plus className="w-5 h-5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-extrabold tracking-wide">Nova Tarefa</span>
        </button>
      )}

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onTaskSaved={() => window.dispatchEvent(new CustomEvent("refresh-data"))}
        taskToEdit={taskToEdit}
      />

      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  );
}
