import type { ChoicePlacement, QuestionType } from "@/features/upload/types";

export type QuestionPattern = {
  stem: string;
  questionType: QuestionType;
  choicePlacement: ChoicePlacement;
};

export const questionPatterns: QuestionPattern[] = [
  {
    stem: "다음 글의 목적으로 가장 적절한 것은?",
    questionType: "purpose",
    choicePlacement: "separate"
  },
  {
    stem: "다음 글에 드러난 X의 심경 변화로 가장 적절한 것은?",
    questionType: "emotion-change",
    choicePlacement: "separate"
  },
  {
    stem: "다음 글에서 필자가 주장하는 바로 가장 적절한 것은?",
    questionType: "claim",
    choicePlacement: "separate"
  },
  {
    stem: "밑줄 친 _____가 다음 글에서 의미하는 바로 가장 적절한 것은?",
    questionType: "underline-meaning",
    choicePlacement: "separate"
  },
  {
    stem: "다음 글의 요지로 가장 적절한 것은?",
    questionType: "gist",
    choicePlacement: "separate"
  },
  {
    stem: "다음 글의 주제로 가장 적절한 것은?",
    questionType: "topic",
    choicePlacement: "separate"
  },
  {
    stem: "다음 글의 제목으로 가장 적절한 것은?",
    questionType: "title",
    choicePlacement: "separate"
  },
  {
    stem: "다음 글의 밑줄 친 부분 중, 어법상 틀린 것은?",
    questionType: "grammar",
    choicePlacement: "embedded-in-passage"
  },
  {
    stem: "다음 글의 밑줄 친 부분 중 문맥상 낱말의 쓰임이 적절하지 않은 것은?",
    questionType: "vocabulary",
    choicePlacement: "embedded-in-passage"
  },
  {
    stem: "다음 빈칸에 들어갈 말로 가장 적절한 것은 고르시오.",
    questionType: "blank",
    choicePlacement: "separate"
  },
  {
    stem: "다음 글에서 전체 흐름과 관계 없는 문장은?",
    questionType: "irrelevant-sentence",
    choicePlacement: "embedded-in-passage"
  },
  {
    stem: "주어진 글 다음에 이어질 글의 순서로 가장 적절한 것을 고르시오",
    questionType: "sentence-order",
    choicePlacement: "separate"
  },
  {
    stem: "글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳을 고르시오.",
    questionType: "sentence-insertion",
    choicePlacement: "mixed"
  },
  {
    stem: "다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?",
    questionType: "summary-blank",
    choicePlacement: "mixed"
  }
];
