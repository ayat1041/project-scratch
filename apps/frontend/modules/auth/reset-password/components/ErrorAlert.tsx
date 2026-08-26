'use client';

interface ErrorAlertProps {
  errorMessage: string | null;
}

export default function ErrorAlert({ errorMessage }: ErrorAlertProps) {
  if (!errorMessage) return null;

  return (
    <div className="border-danger bg-danger/10 text-danger mb-4 w-full max-w-md rounded border p-3">
      {errorMessage}
    </div>
  );
}
