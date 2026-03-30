import { NextResponse } from "next/server";
import {
  detectItemNumberFromImageWithOpenAI,
  hasOpenAIKey
} from "@/lib/openai";

function inferMimeType(fileName: string, fallbackMimeType: string) {
  if (fallbackMimeType) {
    return fallbackMimeType;
  }

  if (fileName.toLowerCase().endsWith(".png")) {
    return "image/png";
  }

  return "image/jpeg";
}

function detectItemNumberFromFileName(fileName: string) {
  const match = fileName.match(/(?:^|[^0-9])(\d{1,3})(?:[^0-9]|$)/);
  return match?.[1] ?? null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "image file is required." }, { status: 400 });
  }

  try {
    if (!hasOpenAIKey()) {
      return NextResponse.json({
        itemNumber: detectItemNumberFromFileName(image.name),
        provider: "fallback"
      });
    }

    const arrayBuffer = await image.arrayBuffer();
    const itemNumber = await detectItemNumberFromImageWithOpenAI(
      Buffer.from(arrayBuffer).toString("base64"),
      inferMimeType(image.name, image.type)
    );

    return NextResponse.json({
      itemNumber,
      provider: "openai"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Item number detection failed."
      },
      { status: 500 }
    );
  }
}
