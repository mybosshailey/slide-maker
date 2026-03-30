import PptxGenJS from "pptxgenjs";
import type { SlideDraft, SlideDraftSlide } from "@/features/upload/types";

const FONT_FACE = "Apple SD Gothic Neo";

function addCoverSlide(slide: PptxGenJS.Slide, slideDraft: SlideDraft) {
  const { coverMetadata } = slideDraft;

  slide.addText(coverMetadata.examTitle, {
    x: 0.82,
    y: 1.55,
    w: 10.8,
    h: 0.7,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: 26,
    bold: true,
    margin: 0,
    align: "left"
  });

  slide.addShape(PptxGenJS.ShapeType.line, {
    x: 0.28,
    y: 2.78,
    w: 8.95,
    h: 0,
    line: {
      color: "E6C400",
      pt: 1.2
    }
  });

  slide.addText(coverMetadata.subjectLabel, {
    x: 3.1,
    y: 3.0,
    w: 2.2,
    h: 0.5,
    color: "FFFFFF",
    fontFace: FONT_FACE,
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
      w: 1.6,
      h: 0.5,
      color: "FFF200",
      fontFace: FONT_FACE,
      fontSize: 22,
      bold: true,
      margin: 0,
      align: "left"
    }
  );

  slide.addText(coverMetadata.instructorName, {
    x: 3.55,
    y: 4.98,
    w: 2.8,
    h: 0.5,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: 22,
    bold: true,
    margin: 0,
    align: "center"
  });
}

function addHeader(slide: PptxGenJS.Slide, headerText: string) {
  slide.addText(headerText, {
    x: 0.18,
    y: 0.12,
    w: 10.9,
    h: 0.4,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: 18,
    bold: true,
    margin: 0
  });
}

function addFooterNotes(slide: PptxGenJS.Slide, footerNotes?: string[]) {
  if (!footerNotes?.length) {
    return;
  }

  slide.addText(footerNotes.join("   "), {
    x: 4.65,
    y: 6.45,
    w: 8.2,
    h: 0.24,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: 8.5,
    bold: true,
    margin: 0,
    align: "right"
  });
}

function addPassageSlide(slide: PptxGenJS.Slide, slideItem: SlideDraftSlide) {
  addHeader(slide, slideItem.headerText || slideItem.title);

  slide.addText(slideItem.content.join("\n"), {
    x: 0.48,
    y: 0.56,
    w: slideItem.kind === "passage-full" ? 11.1 : 10.65,
    h: slideItem.kind === "passage-full" ? 5.9 : 5.35,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: slideItem.kind === "passage-full" ? 15 : 19.5,
    bold: true,
    fit: "shrink",
    breakLine: false,
    margin: 0,
    valign: "top",
    paraSpaceAfter: slideItem.kind === "passage-full" ? 5 : 8
  });

  addFooterNotes(slide, slideItem.footerNotes);
}

function addChoicesSlide(slide: PptxGenJS.Slide, slideItem: SlideDraftSlide) {
  addHeader(slide, slideItem.headerText || slideItem.title);

  const choiceRuns: PptxGenJS.TextProps[] = [];

  slideItem.content.forEach((choice, index) => {
    choiceRuns.push({
      text: choice,
      options: {
        breakLine: true,
        color: "FFFFFF",
        fontFace: FONT_FACE,
        fontSize: 22,
        bold: true
      }
    });

    if (index < slideItem.content.length - 1) {
      choiceRuns.push({
        text: "",
        options: {
          breakLine: true,
          fontSize: 8
        }
      });
    }
  });

  slide.addText(choiceRuns, {
    x: 0.62,
    y: 1.1,
    w: 11.2,
    h: 4.95,
    margin: 0,
    fit: "shrink",
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
    headFontFace: FONT_FACE,
    bodyFontFace: FONT_FACE
  };

  slideDraft.slides.forEach((slideItem) => {
    const slide = pptx.addSlide();
    slide.background = { color: "000000" };

    if (slideItem.kind === "cover") {
      addCoverSlide(slide, slideDraft);
      return;
    }

    if (slideItem.kind === "choices") {
      addChoicesSlide(slide, slideItem);
      return;
    }

    addPassageSlide(slide, slideItem);
  });

  const buffer = (await pptx.write({
    outputType: "nodebuffer"
  })) as Buffer;

  return buffer;
}
