# English PPT Generator MVP Design

## 1. Product Goal
사용자가 영어 지문이 포함된 이미지를 업로드하면 OCR로 텍스트를 추출하고, 내용을 분석한 뒤, 강사용 설명 중심의 PPT 슬라이드 초안을 생성하는 웹앱을 만든다.

## 2. MVP Scope
포함 범위:
- 이미지 업로드
- OCR로 영어 지문 추출
- 문제 제시 문장 기반 문제 유형 분류
- 지문, 문제 제시 문장, 선택지 분리
- 텍스트 요약 및 구조 분석
- 슬라이드 초안 JSON 생성
- PPTX 파일 export

제외 범위:
- 로그인/회원관리
- 다중 사용자 작업 관리
- 고급 템플릿 편집기
- 실시간 협업
- 정교한 슬라이드 디자인 편집
- 도표형 문제
- 일치/불일치 문제
- 장문 문제

## 3. Core User Flow
1. 사용자가 이미지를 업로드한다.
2. 서버가 OCR을 수행해 영어 지문을 추출한다.
3. 추출된 텍스트를 문제 구조 단위로 분리한다.
4. 분리된 지문을 분석해 핵심 내용을 정리한다.
5. 분석 결과를 바탕으로 슬라이드 초안을 생성한다.
6. 사용자가 초안을 확인한다.
7. PPTX 파일로 export 한다.

## 4. Product Rules
- 슬라이드는 간결해야 한다.
- 강사용 설명 중심으로 작성한다.
- 한 슬라이드에 정보가 과도하게 몰리지 않게 한다.
- 원문 내용을 왜곡하지 않는다.
- MVP에서는 시각적 완성도보다 구조적으로 좋은 초안 생성에 집중한다.

## 5. Tech Stack
- Frontend: Next.js
- Backend: Node.js
- AI: OpenAI API
- PPT Export: `pptxgenjs`
- OCR:
  - 1안: OpenAI Vision 기반 텍스트 추출
  - 2안: 별도 OCR 서비스 연동 가능하도록 추상화

## 6. High-Level Architecture
```text
Next.js Web
  -> Node.js API
    -> OCR Service
    -> Text Analysis Service
    -> Slide Draft Service
    -> PPT Export Service
```

## 7. System Modules

### 7.1 Web App
역할:
- 이미지 업로드 UI
- 처리 상태 표시
- 생성된 슬라이드 초안 미리보기
- PPT 다운로드 버튼 제공

### 7.2 Upload Module
역할:
- 이미지 파일 수신
- 파일 형식 및 크기 검증
- 임시 저장소에 보관
- `fileId` 반환

입력:
- jpg
- jpeg
- png

출력 예시:
```json
{
  "fileId": "file_123"
}
```

### 7.3 OCR Module
역할:
- 이미지에서 영어 지문 추출
- 문단 및 줄 단위 텍스트 정리
- OCR 품질이 낮은 경우 후처리

출력 예시:
```json
{
  "rawText": "....",
  "paragraphs": ["...", "..."]
}
```

### 7.4 Text Processing Module
역할:
- OCR 결과에서 문제 번호, 문제 제시 문장, 지문 본문, 선택지 분리
- 문제 제시 문장 기반 문제 유형 분류
- 선택지가 지문에 포함된 유형 여부 표시
- 핵심 주제 파악
- 문단별 핵심 내용 추출
- 슬라이드 분할 기준 생성
- 강사용 설명 포인트 생성

출력 예시:
```json
{
  "problemParse": {
    "itemNumber": "33",
    "instruction": "다음 글의 제목으로 가장 적절한 것은?",
    "questionType": "title",
    "choicePlacement": "separate",
    "passage": "...",
    "choices": ["...", "..."]
  },
  "analysis": {
    "documentTitle": "Main Topic",
    "summary": "Short summary",
    "sections": [
      {
        "heading": "Section 1",
        "bullets": ["...", "..."],
        "teacherNotes": ["..."]
      }
    ]
  }
}
```

### 7.5 Slide Generation Module
역할:
- 분석 결과를 슬라이드 구조로 변환
- 제목 슬라이드, 본문 슬라이드, 정리 슬라이드 생성

### 7.6 PPT Export Module
역할:
- 슬라이드 구조 JSON을 실제 `.pptx` 파일로 변환
- 다운로드 가능한 파일 경로 또는 바이너리 반환

## 8. Data Model

기존 구조:
```json
{
  "title": "string",
  "content": ["string"]
}
```

위 구조는 MVP 출발점으로는 이해하기 쉽지만, 강사용 설명과 슬라이드 타입 구분을 담기엔 너무 단순하다. 아래 구조를 기본안으로 사용한다.

### SlideDraft
```ts
type SlideDraft = {
  documentTitle: string;
  sourceText: string;
  slides: SlideItem[];
};
```

### SlideItem
```ts
type SlideItem = {
  id: string;
  type: "title" | "content" | "summary";
  title: string;
  bullets: string[];
  speakerNotes?: string[];
};
```

### OCRResult
```ts
type OCRResult = {
  fileId: string;
  rawText: string;
  paragraphs: string[];
};
```

### ProblemParseResult
```ts
type ProblemParseResult = {
  fileId: string;
  itemNumber?: string;
  instruction: string;
  questionType:
    | "purpose"
    | "emotion-change"
    | "claim"
    | "underline-meaning"
    | "gist"
    | "topic"
    | "title"
    | "grammar"
    | "vocabulary"
    | "blank"
    | "irrelevant-sentence"
    | "sentence-order"
    | "sentence-insertion"
    | "summary-blank"
    | "unknown";
  choicePlacement: "separate" | "embedded-in-passage" | "mixed";
  passage: string;
  choices: {
    label: string;
    text: string;
  }[];
};
```

### AnalysisResult
```ts
type AnalysisResult = {
  fileId: string;
  documentTitle: string;
  summary: string;
  sections: {
    heading: string;
    bullets: string[];
    teacherNotes: string[];
  }[];
};
```

## 9. API Design

### `POST /api/uploads`
설명:
- 이미지 업로드

응답:
```json
{
  "fileId": "file_123"
}
```

### `POST /api/drafts`
설명:
- 업로드된 이미지를 기반으로 OCR, 문제 구조 분리, 분석, 슬라이드 초안 생성

요청:
```json
{
  "fileId": "file_123"
}
```

응답:
```json
{
  "draftId": "draft_123",
  "documentTitle": "Example Title",
  "slides": []
}
```

### `GET /api/drafts/:id`
설명:
- 생성된 슬라이드 초안 조회

### `POST /api/problem-parse`
설명:
- OCR 결과에서 문제 번호, 문제 제시 문장, 지문, 선택지를 분리

### `POST /api/exports/ppt`
설명:
- 슬라이드 초안 JSON을 `.pptx`로 변환

## 10.1 Supported Question Types For MVP
- 지원:
  - 목적
  - 심경 변화
  - 주장
  - 밑줄 의미
  - 요지
  - 주제
  - 제목
  - 어법
  - 어휘
  - 빈칸
  - 흐름과 관계 없는 문장
  - 글의 순서
  - 문장 삽입
  - 요약문 완성
- 제외:
  - 도표
  - 내용 일치/불일치
  - 안내문 일치/불일치
  - 장문 문제

## 10. Suggested Folder Structure
```text
apps/
  web/
    src/
      app/
        page.tsx
        upload/page.tsx
        result/[draftId]/page.tsx
      components/
      features/
        upload/
        draft/
      lib/

  api/
    src/
      server.ts
      app.ts
      routes/
        upload.route.ts
        draft.route.ts
        export.route.ts
      controllers/
      services/
        storage.service.ts
        ocr.service.ts
        analysis.service.ts
        slide-generation.service.ts
        ppt-export.service.ts
        openai.service.ts
      schemas/
      types/

packages/
  shared/
    src/
      types/
      dto/
```

## 11. Design Principles
- 각 단계는 서비스 단위로 분리한다.
- OCR, 분석, PPT 생성은 서로 독립적으로 교체 가능해야 한다.
- OpenAI 호출은 공통 래퍼로 감싼다.
- MVP에서는 DB 없이 파일 또는 메모리 저장으로 시작 가능하다.
- 이후 queue, DB, template system을 붙일 수 있게 구조를 단순하게 유지한다.

## 12. Future Extensions
- OCR 엔진 교체
- 슬라이드 템플릿 선택
- PDF 입력 지원
- 사용자 수정 후 재생성
- 다양한 발표자료 스타일 생성
