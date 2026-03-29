import type { QuestionTypeHint } from "@/features/upload/types";

export const questionTypeOptions: Array<{
  value: QuestionTypeHint;
  label: string;
}> = [
  { value: "auto", label: "자동 감지" },
  { value: "purpose", label: "목적" },
  { value: "emotion-change", label: "심경 변화" },
  { value: "claim", label: "주장" },
  { value: "underline-meaning", label: "밑줄 의미" },
  { value: "gist", label: "요지" },
  { value: "topic", label: "주제" },
  { value: "title", label: "제목" },
  { value: "grammar", label: "어법" },
  { value: "vocabulary", label: "어휘" },
  { value: "blank", label: "빈칸" },
  { value: "irrelevant-sentence", label: "흐름과 관계 없는 문장" },
  { value: "sentence-order", label: "글의 순서" },
  { value: "sentence-insertion", label: "문장 삽입" },
  { value: "summary-blank", label: "요약문 완성" }
];
