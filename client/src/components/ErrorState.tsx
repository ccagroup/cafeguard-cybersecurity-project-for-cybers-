export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="panel" role="alert">
      <p>{message}</p>
      <button className="btn btn-secondary" style={{ marginTop: "var(--space-4)" }} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
