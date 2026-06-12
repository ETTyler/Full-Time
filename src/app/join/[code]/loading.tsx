function Line({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-card-2 ${className}`} />;
}

/** Instant skeleton for the invite page — mirrors the ticket card. */
export default function LoadingJoin() {
  return (
    <section className="mx-auto max-w-md py-16" aria-busy aria-label="Loading invite">
      <div className="card relative overflow-hidden p-8 text-center">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-gold to-accent" />
        <Line className="mx-auto h-3 w-24" />
        <Line className="mx-auto mt-4 h-8 w-48" />
        <Line className="mx-auto mt-3 h-4 w-40" />
        <Line className="mx-auto mt-8 h-10 w-44" />
      </div>
    </section>
  );
}
