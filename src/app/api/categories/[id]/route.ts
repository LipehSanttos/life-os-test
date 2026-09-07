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
    if (category.isSystem) {
      return NextResponse.json({ error: "Categorias padrão do sistema não podem ser excluídas." }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir categoria." }, { status: 500 });
  }
}
