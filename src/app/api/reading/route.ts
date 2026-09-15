import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const books = await prisma.book.findMany({
      where: { userId: user.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(books);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao buscar livros." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    const {
      title,
      author,
      isbn,
      coverUrl,
      totalPages = 100,
      currentPage = 0,
      progress = 0,
      categoryId,
      fileUrl,
      fileFormat,
      fileSize,
      currentLocation,
      readingSettings,
      status = "READING",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Título do livro é obrigatório." }, { status: 400 });
    }

    let book: any;
    try {
      book = await prisma.book.create({
        data: {
          userId: user.id,
          title: title.trim(),
          author: author ? author.trim() : null,
          isbn: isbn ? isbn.trim() : null,
          coverUrl: coverUrl ? coverUrl.trim() : null,
          totalPages: Number(totalPages) || 100,
          currentPage: Number(currentPage) || 0,
          progress: Number(progress) || 0,
          status: status || "READING",
          categoryId: categoryId || null,
          fileUrl: fileUrl ? fileUrl.trim() : null,
          fileFormat: fileFormat || null,
          fileSize: fileSize !== null && fileSize !== undefined ? Number(fileSize) : null,
          currentLocation: currentLocation || null,
          readingSettings: readingSettings || null,
        },
        include: { category: true },
      });
    } catch (createErr: any) {
      // Fallback caso colunas novas ainda não existam no schema do Supabase
      console.warn("[api/reading] Criação com campos de eBook falhou, tentando fallback base:", createErr.message);
      book = await prisma.book.create({
        data: {
          userId: user.id,
          title: title.trim(),
          author: author ? author.trim() : null,
          isbn: isbn ? isbn.trim() : null,
          coverUrl: coverUrl ? coverUrl.trim() : null,
          totalPages: Number(totalPages) || 100,
          currentPage: Number(currentPage) || 0,
          progress: Number(progress) || 0,
          status: status || "READING",
          categoryId: categoryId || null,
        },
        include: { category: true },
      });
      book.fileUrl = fileUrl || null;
      book.fileFormat = fileFormat || null;
      book.fileSize = fileSize || null;
      book.currentLocation = currentLocation || null;
      book.readingSettings = readingSettings || null;
    }

    return NextResponse.json(book, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao cadastrar livro." }, { status: 500 });
  }
}
