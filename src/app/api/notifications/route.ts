import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const userFilter = { userId: user.id };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Busca as tarefas do usuário autenticado incluindo dados da categoria
    let userTasks: any[] = [];
    try {
      userTasks = await prisma.task.findMany({
        where: { userId: user.id },
        include: { category: true },
      });
    } catch (taskErr: any) {
      console.warn("[api/notifications] Falha ao consultar tarefas:", taskErr?.message || taskErr);
      userTasks = [];
    }

    // 1. Identifica e processa tarefas de aniversários em memória
    const upcomingBirthdays: any[] = [];
    for (const bTask of userTasks) {
      if (!bTask.dueDate) continue;

      const catSlug = bTask.category?.slug?.toLowerCase() || "";
      const catName = bTask.category?.name?.toLowerCase() || "";
      const title = bTask.title?.toLowerCase() || "";

      const isBirthday =
        catSlug === "aniversarios" ||
        catName.includes("aniversár") ||
        catName.includes("aniversar") ||
        title.includes("aniversár") ||
        title.includes("aniversar") ||
        title.includes("niver");

      if (!isBirthday) continue;

      const due = new Date(bTask.dueDate);
      const birthMonth = due.getMonth();
      const birthDay = due.getDate();

      // Aniversário no ano corrente
      let targetDate = new Date(now.getFullYear(), birthMonth, birthDay, 0, 0, 0);

      // Se já passou há mais de 1 dia no ano atual, projeta para o próximo ano
      const diffTime = targetDate.getTime() - todayStart.getTime();
      let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        targetDate = new Date(now.getFullYear() + 1, birthMonth, birthDay, 0, 0, 0);
        const nextDiffTime = targetDate.getTime() - todayStart.getTime();
        diffDays = Math.round(nextDiffTime / (1000 * 60 * 60 * 24));
      }

      // Notifica se for Hoje ou nos próximos 15 dias
      if (diffDays >= 0 && diffDays <= 15) {
        const formattedDate = format(new Date(now.getFullYear(), birthMonth, birthDay), "dd 'de' MMMM", {
          locale: ptBR,
        });

        let statusText = `em ${diffDays} dias`;
        if (diffDays === 0) statusText = "É Hoje!";
        else if (diffDays === 1) statusText = "É Amanhã!";

        upcomingBirthdays.push({
          id: bTask.id,
          title: bTask.title,
          description: bTask.description,
          formattedDate,
          daysUntil: diffDays,
          statusText,
          isToday: diffDays === 0,
          isTomorrow: diffDays === 1,
        });
      }
    }

    // Ordena por proximidade (Hoje primeiro)
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    // 2. Filtra tarefas atrasadas normais (excluindo concluídas e aniversários)
    const overdueTasks = userTasks
      .filter((t) => {
        if (t.status === "COMPLETED") return false;
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        if (due >= todayStart) return false;

        const catSlug = t.category?.slug?.toLowerCase() || "";
        const catName = t.category?.name?.toLowerCase() || "";
        const title = t.title?.toLowerCase() || "";

        const isBirthday =
          catSlug === "aniversarios" ||
          catName.includes("aniversár") ||
          catName.includes("aniversar") ||
          title.includes("aniversár") ||
          title.includes("aniversar") ||
          title.includes("niver");

        return !isBirthday;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);

    // 3. Busca contas com vencimento pendente próximo ou atrasado
    const nextThreeDays = new Date(todayStart.getTime() + 3 * 24 * 60 * 60 * 1000);
    let bills: any[] = [];
    try {
      bills = await prisma.financialReminder.findMany({
        where: {
          userId: user.id,
          dueDate: { lte: nextThreeDays },
          status: "PENDING",
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      });
    } catch (finErr: any) {
      console.warn("[api/notifications] Falha ao consultar lembretes financeiros:", finErr?.message || finErr);
      bills = [];
    }

    const totalCount = upcomingBirthdays.length + overdueTasks.length + bills.length;

    return NextResponse.json({
      totalCount,
      birthdays: upcomingBirthdays,
      overdueTasks,
      bills,
    });
  } catch (error: any) {
    console.error("[api/notifications] Erro inesperado ao carregar notificações:", error?.message || error);
    // Fallback defensivo que nunca retorna 500 para não quebrar a barra de navegação
    return NextResponse.json({
      totalCount: 0,
      birthdays: [],
      overdueTasks: [],
      bills: [],
    });
  }
}

