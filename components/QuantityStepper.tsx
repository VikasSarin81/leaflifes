"use client";

export default function QuantityStepper({
  quantity,
  onChange,
  max,
}: {
  quantity: number;
  onChange: (next: number) => void;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center border border-ink/30">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="h-9 w-9 text-lg leading-none hover:bg-ink/5"
        onClick={() => onChange(quantity - 1)}
      >
        −
      </button>
      <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="h-9 w-9 text-lg leading-none hover:bg-ink/5 disabled:opacity-30"
        disabled={max !== undefined && quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
