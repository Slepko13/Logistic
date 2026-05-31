import { FallbackProps } from 'react-error-boundary';

// Компонент, який показується, якщо весь додаток "впав" через критичну помилку
export default function ErrorFallback({ error }: FallbackProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
      <h2 className="mb-4 text-3xl font-bold text-destructive">Ой! Щось пішло не так 🤕</h2>
      <p className="mb-4 text-muted-foreground">
        Ми вже знаємо про цю проблему і працюємо над нею.
      </p>
      <pre className="mb-8 p-4 bg-card border border-border rounded shadow text-left text-sm text-destructive max-w-2xl overflow-auto">
        {error instanceof Error ? error.message : String(error)}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Перезавантажити сторінку
      </button>
    </div>
  );
}
