import Header from '@/components/pdf-scry/header';
import PdfScryClient from '@/components/pdf-scry/pdf-scry-client';
import Toaster from '@/components/ui/toaster';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <PdfScryClient />
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>PDF Scry - Extract and Analyze with Ease</p>
      </footer>
      <Toaster />
    </div>
  );
}
