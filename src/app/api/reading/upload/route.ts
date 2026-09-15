/**
 * @file route.ts (API /api/reading/upload)
 * @description Endpoint de upload multipart para eBooks (PDF e EPUB).
 * Suporta Supabase Storage (Cloud), sistema de arquivos local (Node.js) e
 * sinalização de fallback para IndexedDB caso o servidor opere em ambiente serverless sem disco.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
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
    const safeHash = crypto.randomBytes(12).toString("hex");
    const filename = `ebook_${Date.now()}_${safeHash}${ext}`;

    // 1. Tenta upload via Supabase Storage (se configurado)
    if (isSupabaseConfigured()) {
      try {
        const bucketName = "ebooks";
        // Cria o bucket caso ainda não exista
        try {
          await supabaseAdmin.storage.createBucket(bucketName, { public: true });
        } catch {
          // Ignora se o bucket já existir
        }

        const contentType =
          file.type || (format === "pdf" ? "application/pdf" : "application/epub+zip");

        const storagePath = `user_${user.id}/${filename}`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(storagePath);
          return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            format,
            size: file.size,
            filename: file.name,
          });
        }
      } catch (storageErr) {
        console.warn("[upload] Falha no Supabase Storage, tentando fallback local:", storageErr);
      }
    }

    // 2. Tenta salvar no sistema de arquivos local (se ambiente Node.js permitir escrita)
    try {
      const fs = await import("fs");
      const path = await import("path");

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "ebooks");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

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
    } catch (fsErr) {
      console.warn("[upload] Sistema de arquivos somente leitura (serverless/edge):", fsErr);
    }

    // 3. Fallback gracioso para persistência local no navegador via IndexedDB
    // Permite que a aplicação continue funcionando sem erros 500 mesmo em ambientes sem disco gravável
    return NextResponse.json({
      success: true,
      fallbackToClient: true,
      format,
      size: file.size,
      filename: file.name,
      message: "Armazenando arquivo de leitura localmente no navegador.",
    });
  } catch (error: any) {
    console.error("Erro no upload do eBook:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar envio do arquivo de leitura." },
      { status: 500 }
    );
  }
}
