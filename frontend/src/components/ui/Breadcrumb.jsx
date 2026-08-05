import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// items: [{ label, to }] - the last item renders as plain text (current
// page), everything before it is a link. Kept deliberately tiny: this app
// is two levels deep at most (Farms -> Farm name).
export default function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-1">
      <ol className="flex items-center gap-1 text-sm text-neutral-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.to || item.label} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />}
              {isLast || !item.to ? (
                <span className={isLast ? "text-neutral-500" : undefined} aria-current={isLast ? "page" : undefined}>
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
