import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// items: [{ label, to }] - the last item renders as plain text (current
// page), everything before it is a link.
export default function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-1.5">
      <ol className="flex items-center gap-1.5 text-sm text-neutral-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.to || item.label} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />}
              {isLast || !item.to ? (
                <span className={isLast ? "font-medium text-neutral-500" : undefined} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="focus-ring rounded font-medium text-brand-700 hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
