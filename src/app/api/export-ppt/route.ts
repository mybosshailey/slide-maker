import { NextResponse } from "next/server";
import { exportSlideDraftToPptx } from "@/features/slides/export";
import type { SlideDraft } from "@/features/upload/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slideDraft?: SlideDraft;
  };

  if (!body.slideDraft) {
    return NextResponse.json({ error: "slideDraft is required." }, { status: 400 });
  }

  try {
    const buffer = await exportSlideDraftToPptx(body.slideDraft);
    const baseName =
      body.slideDraft.coverMetadata?.examTitle?.trim() ||
      body.slideDraft.title ||
      "lesson-draft";
    const sanitizedBaseName = baseName.replace(/[\\/:*?"<>|]/g, "-");
    const asciiFallback =
      sanitizedBaseName
        .replace(/[^\x20-\x7E]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "lesson-draft";
    const encodedFileName = encodeURIComponent(`${sanitizedBaseName}.pptx`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${asciiFallback}.pptx"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "PPT export failed."
      },
      { status: 500 }
    );
  }
}
