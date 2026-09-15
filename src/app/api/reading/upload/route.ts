/**
 * @file route.ts (API /api/reading/upload)
 * @description Endpoint de upload multipart para eBooks (PDF e EPUB).
 * Valida MIME types e extensões, limita tamanho em 50MB, gera nomes seguros
 * e armazena os arquivos em `/public/uploads/ebooks/`.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo de livro foi enviado." }, { status: 400 });
    }

    const originalName = file.name.toLowerCase();
    let format: "pdf" | "epub" | null = null;
    let ext = "";

    if (file.type === "application/pdf" || originalName.endsWith(".pdf")) {
      format = "pdf";
      ext = ".pdf";
    } else if (
      file.type === "application/epub+zip" ||
      file.type === "application/epub" ||
      originalName.endsWith(".epub")
    ) {
      format = "epub";
      ext = ".epub";
    }

    if (!format) {
      return NextResponse.json(
        { error: "Formato inválido. Por favor, envie um arquivo em formato PDF (.pdf) ou EPUB (.epub)." },
        { status: 400 }
      );
    }

    // Limite máximo de 50 Megabytes
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "O arquivo excede o limite máximo permitido de 50MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "ebooks");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeHash = crypto.randomBytes(12).toString("hex");
    const filename = `ebook_${Date.now()}_${safeHash}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/ebooks/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      format,
      size: file.size,
      filename: file.name,
    });
  } catch (error: any) {
    console.error("Erro no upload do eBook:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar envio do arquivo de leitura." },
      { status: 500 }
    );
  }
}
