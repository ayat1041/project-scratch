'use client';

interface ErrorAlertProps {
  errorMessage: string | null;
}

export default function ErrorAlert({ errorMessage }: ErrorAlertProps) {
  if (!errorMessage) return null;

  return (
    <div className="border-destructive bg-destructive/10 text-destructive mb-4 w-full max-w-md rounded border p-3">
      {errorMessage}
    </div>
  );
}
