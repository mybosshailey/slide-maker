import { UploadCard } from "@/components/upload-card";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">English PPT Generator</p>
        <h1>Upload a passage image and turn it into a draft-ready slide flow.</h1>
        <p className="hero-copy">
          Start with a clean upload experience first. We will layer OCR and slide
          generation on top of this flow next.
        </p>
      </section>
      <UploadCard />
    </main>
  );
}
