import PptxGenJS from "pptxgenjs";
import type { SlideDraft } from "@/features/upload/types";

function addCoverSlide(slide: PptxGenJS.Slide, slideDraft: SlideDraft) {
  const { coverMetadata } = slideDraft;

  slide.addText(coverMetadata.examTitle, {
    x: 0.82,
    y: 1.55,
    w: 10.8,
    h: 0.7,
    color: "FFFFFF",
    fontFace: "Aptos",
    fontSize: 26,
    bold: true,
    margin: 0,
    align: "left"
  });

  slide.addShape(PptxGenJS.ShapeType.line, {
    x: 0.3,
    y: 2.78,
    w: 8.9,
    h: 0,
    line: {
      color: "E6C400",
      pt: 1.2
    }
  });

  slide.addText(coverMetadata.subjectLabel, {
    x: 3.2,
    y: 3.0,
    w: 2.0,
    h: 0.5,
    color: "FFFFFF",
    fontFace: "Aptos",
    fontSize: 22,
    bold: true,
    margin: 0,
    align: "center"
  });

  slide.addText(
    coverMetadata.itemNumber ? `${coverMetadata.itemNumber}번` : "",
    {
      x: 4.95,
      y: 3.0,
      w: 1.4,
      h: 0.5,
      color: "FFF200",
      fontFace: "Aptos",
      fontSize: 22,
      bold: true,
      margin: 0,
      align: "left"
    }
  );

  slide.addText(coverMetadata.instructorName, {
    x: 3.7,
    y: 4.95,
    w: 2.3,
    h: 0.5,
    color: "FFFFFF",
    fontFace: "Aptos",
    fontSize: 22,
    bold: true,
    margin: 0,
    align: "center"
  });
}

function addSlideContent(
  slide: PptxGenJS.Slide,
  content: string[],
  widthRatio: number
) {
  const contentWidth = 13.333 * widthRatio;
  const contentHeight = 6.6;

  slide.addText(content.join("\n\n"), {
    x: 0.8,
    y: 0.7,
    w: contentWidth,
    h: contentHeight,
    color: "FFFFFF",
    fontFace: "Aptos",
    fontSize: 22,
    breakLine: false,
    margin: 0,
    valign: "top"
  });
}

export async function exportSlideDraftToPptx(slideDraft: SlideDraft) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Codex";
  pptx.company = "OpenAI";
  pptx.subject = "English PPT Generator";
  pptx.title = slideDraft.title;
  pptx.theme = {
    headFontFace: "Aptos",
    bodyFontFace: "Aptos"
  };

  slideDraft.slides.forEach((slideItem) => {
    const slide = pptx.addSlide();
    slide.background = { color: "000000" };

    if (slideItem.kind === "cover") {
      addCoverSlide(slide, slideDraft);
      return;
    }

    slide.addText(slideItem.title, {
      x: 0.8,
      y: 0.25,
      w: 5.5,
      h: 0.35,
      color: "FFFFFF",
      fontFace: "Aptos",
      fontSize: 11,
      bold: true,
      margin: 0
    });

    addSlideContent(slide, slideItem.content, slideItem.widthRatio);
  });

  const buffer = (await pptx.write({
    outputType: "nodebuffer"
  })) as Buffer;

  return buffer;
}
