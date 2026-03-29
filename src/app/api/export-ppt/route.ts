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
    const fileName = `${body.slideDraft.title || "lesson-draft"}.pptx`
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
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
