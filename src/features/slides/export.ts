import PptxGenJS from "pptxgenjs";
import type { SlideDraft } from "@/features/upload/types";

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
