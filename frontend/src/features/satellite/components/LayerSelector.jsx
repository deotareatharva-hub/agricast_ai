export default function LayerSelector({ layers, value, onChange }) {
  if (!layers?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {layers.map((layer) => (
        <button
          key={layer.id}
          type="button"
          onClick={() => onChange(layer.id)}
          title={layer.description}
          className={`focus-ring rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            value === layer.id
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}
