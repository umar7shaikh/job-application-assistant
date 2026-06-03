import Link from "next/link";

/** The wordmark — a comic-style ink-outlined badge. */
export function Wordmark({
  className = "",
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={`select-none ${className}`}>
      <span className="ink-edge-sm inline-block -rotate-2 rounded-lg bg-pop-red px-3 py-0.5 font-comic text-2xl tracking-wide text-white">
        LEVER
      </span>
    </Link>
  );
}
