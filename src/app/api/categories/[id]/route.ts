import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }

    if (existing.isSystem && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem modificar categorias padrão do sistema." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, color, icon, sortOrder } = body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        color: color !== undefined ? color : existing.color,
        icon: icon !== undefined ? icon : existing.icon,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existing.sortOrder,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar categoria." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }

    // 1. Registra a exclusão isolada para o usuário autenticado em ActivityLog
    // Isso garante que a categoria desapareça para ele, mas continue existindo para os outros usuários
    const existingExclusion = await prisma.activityLog.findFirst({
      where: {
        userId: user.id,
        entityType: "CATEGORY_EXCLUSION",
        entityId: id,
      },
    });

    if (!existingExclusion) {
      await prisma.activityLog.create({
        data: {
          entityType: "CATEGORY_EXCLUSION",
          entityId: id,
          action: "EXCLUDE",
          title: category.name,
          details: category.slug,
          userId: user.id,
        },
      });
    }

    // 2. Desvincula com segurança as entidades pertencentes exclusivamente a este usuário
    // Sem apagar as tarefas ou projetos em si, apenas removendo o vínculo com a categoria excluída
    await Promise.all([
      prisma.task.updateMany({ where: { userId: user.id, categoryId: id }, data: { categoryId: null } }),
      prisma.project.updateMany({ where: { userId: user.id, categoryId: id }, data: { categoryId: null } }),
      prisma.course.updateMany({ where: { userId: user.id, categoryId: id }, data: { categoryId: null } }),
      prisma.book.updateMany({ where: { userId: user.id, categoryId: id }, data: { categoryId: null } }),
      prisma.financialReminder.updateMany({ where: { userId: user.id, categoryId: id }, data: { categoryId: null } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Categoria "${category.name}" excluída com sucesso para o seu perfil.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir categoria." }, { status: 500 });
  }
}
