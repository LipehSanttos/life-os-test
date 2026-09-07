/**
 * @file route.ts (API /api/upload)
 * @description Endpoint de upload multipart para processamento seguro de imagens locais de capas de livros.
 * Valida MIME types permitidos, limita tamanho em 10MB, gera nomes únicos com hashes criptográficos
 * e armazena os arquivos em `/public/uploads/covers/`.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * POST /api/upload
 * Processa o envio de arquivo de imagem do computador e retorna o caminho público gerado.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo de imagem foi enviado." }, { status: 400 });
    }

    // Validação estrita de tipos MIME aceitos (restringe formatos raster/vetoriais perigosos como SVG)
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/avif": ".avif",
    };

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Formato de arquivo inválido. Apenas imagens PNG, JPG, JPEG, WEBP, GIF ou AVIF são permitidas." },
        { status: 400 }
      );
    }

    // Limite máximo de 10 megabytes
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "A imagem deve ter no máximo 10MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Garante que o diretório de destino existe no sistema de arquivos
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "covers");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Geração de nome único e seguro com hash criptográfico e extensão controlada pelo servidor
    const safeHash = crypto.randomBytes(16).toString("hex");
    const filename = `cover_${Date.now()}_${safeHash}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/covers/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar envio da imagem." },
      { status: 500 }
    );
  }
}
