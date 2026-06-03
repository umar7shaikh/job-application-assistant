import Link from "next/link";

/** The wordmark. Serif, with a single emerald accent mark. */
export function Wordmark({
  className = "",
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`font-serif text-xl tracking-tight text-ink ${className}`}
    >
      Lever<span className="text-accent">.</span>
    </Link>
  );
}
