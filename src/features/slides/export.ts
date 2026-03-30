import PptxGenJS from "pptxgenjs";
import type { SlideDraft, SlideDraftSlide } from "@/features/upload/types";

const FONT_FACE = "Calibri";
const COVER_FONT_FACE = "Helvetica";

function indentFirstParagraph(text: string) {
  if (!text.trim()) {
    return text;
  }

  return `\u2003\u2003${text}`;
}

function addCoverSlide(slide: PptxGenJS.Slide, slideDraft: SlideDraft) {
  const { coverMetadata } = slideDraft;

  slide.addText(coverMetadata.examTitle, {
    x: 0.82,
    y: 1.55,
    w: 10.8,
    h: 0.7,
    color: "FFFFFF",
    fontFace: COVER_FONT_FACE,
    fontSize: 35,
    bold: true,
    margin: 0,
    align: "left"
  });

  slide.addShape("rect", {
    x: 0.28,
    y: 2.78,
    w: 8.95,
    h: 0.02,
    fill: {
      color: "E6C400"
    },
    line: {
      color: "E6C400",
      transparency: 100,
      pt: 0
    }
  });

  slide.addText(coverMetadata.subjectLabel, {
    x: 3.1,
    y: 3.0,
    w: 2.5,
    h: 0.5,
    color: "FFFFFF",
    fontFace: COVER_FONT_FACE,
    fontSize: 33,
    bold: true,
    margin: 0,
    align: "center"
  });

  slide.addText(
    coverMetadata.itemNumber ? `${coverMetadata.itemNumber}번` : "",
    {
      x: 5.45,
      y: 3.0,
      w: 1.6,
      h: 0.5,
      color: "FFF200",
      fontFace: COVER_FONT_FACE,
      fontSize: 33,
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
    fontFace: COVER_FONT_FACE,
    fontSize: 36,
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
    fontSize: 24,
    bold: false,
    margin: 0
  });
}

function addFooterNotes(
  slide: PptxGenJS.Slide,
  slideItem: SlideDraftSlide,
  footerNotes?: string[]
) {
  if (!footerNotes?.length) {
    return;
  }

  const isFullPassage = slideItem.kind === "passage-full";
  const passageRightEdge = isFullPassage ? 10.98 : 9.63;
  const footerWidth = isFullPassage ? 10.0 : 9.0;

  slide.addText(footerNotes.join("   "), {
    x: passageRightEdge - footerWidth,
    y: isFullPassage ? 6.43 : 6.32,
    w: footerWidth,
    h: isFullPassage ? 0.32 : 0.32,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: isFullPassage ? 17 : 18,
    bold: false,
    margin: 0,
    align: "right",
    fit: "shrink",
    breakLine: false
  });
}

function addPassageSlide(slide: PptxGenJS.Slide, slideItem: SlideDraftSlide) {
  addHeader(slide, slideItem.headerText || slideItem.title);
  const isFullPassage = slideItem.kind === "passage-full";
  const isSecondPassageSlide = slideItem.id.endsWith("-passage-2");
  const shouldIndentFirstParagraph = isFullPassage || !isSecondPassageSlide;
  const rawContentText = slideItem.content.join("\n");
  const contentText = shouldIndentFirstParagraph
    ? indentFirstParagraph(rawContentText)
    : rawContentText;

  slide.addText(contentText, {
    x: isFullPassage ? 0.18 : 0.38,
    y: isFullPassage ? 0.64 : 0.64,
    w: isFullPassage ? 10.8 : 9.25,
    h: isFullPassage ? 6.0 : 4.95,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: isFullPassage ? 22 : 24,
    bold: false,
    align: "justify",
    fit: "shrink",
    breakLine: false,
    margin: isFullPassage ? 0.02 : 0.02,
    valign: "top",
    lineSpacingMultiple: 1.5,
    paraSpaceBefore: 0,
    paraSpaceAfter: 0
  });

  addFooterNotes(slide, slideItem, slideItem.footerNotes);
}

function addChoicesSlide(slide: PptxGenJS.Slide, slideItem: SlideDraftSlide) {
  addHeader(slide, slideItem.headerText || slideItem.title);

  slide.addText(slideItem.content.join("\n\n"), {
    x: 0.62,
    y: 1.1,
    w: 11.2,
    h: 4.95,
    color: "FFFFFF",
    fontFace: FONT_FACE,
    fontSize: 22.5,
    bold: false,
    margin: 0,
    fit: "shrink",
    valign: "top",
    paraSpaceAfter: 4.5
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
