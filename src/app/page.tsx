import { UploadCard } from "@/components/upload-card";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="minimal-hero">
        <h1>Generate your lesson instantly</h1>
      </section>
      <UploadCard />
    </main>
  );
}
