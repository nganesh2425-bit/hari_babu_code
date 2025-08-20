import { BookText } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <BookText className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            PDF Scry
          </h1>
        </div>
      </div>
    </header>
  );
}
