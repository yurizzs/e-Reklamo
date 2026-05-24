type StrengthLevel = {
  label: string;
  className: string;
};

function hasLower(value: string) {
  return /[a-z]/.test(value);
}

function hasUpper(value: string) {
  return /[A-Z]/.test(value);
}

function hasNumber(value: string) {
  return /[0-9]/.test(value);
}

function hasSymbol(value: string) {
  return /[^A-Za-z0-9]/.test(value);
}

function meter(score: number): StrengthLevel {
  if (score <= 1) return { label: "Weak", className: "bg-red-500/70" };
  if (score === 2) return { label: "Fair", className: "bg-amber-400/70" };
  if (score === 3) return { label: "Good", className: "bg-emerald-400/70" };
  return { label: "Strong", className: "bg-emerald-500" };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const minLengthOk = password.length >= 8;
  const mixedCaseOk = hasLower(password) && hasUpper(password);
  const numberOk = hasNumber(password);
  const symbolOk = hasSymbol(password);

  const score = [minLengthOk, mixedCaseOk, numberOk, symbolOk].filter(Boolean)
    .length;
  const widthPct = (score / 4) * 100;
  const level = meter(score);

  const pill = (ok: boolean) =>
    ok
      ? "text-emerald-300 border-emerald-500/25 bg-emerald-500/10"
      : "text-slate-400 border-white/10 bg-black/30";

  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">
          Strength
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
          {level.label}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-black/40 border border-white/5 overflow-hidden">
        <div
          className={`h-full ${level.className} transition-[width] duration-300`}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-mono border ${pill(
            minLengthOk,
          )}`}
        >
          8+ chars
        </span>
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-mono border ${pill(
            mixedCaseOk,
          )}`}
        >
          upper+lower
        </span>
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-mono border ${pill(
            numberOk,
          )}`}
        >
          number
        </span>
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-mono border ${pill(
            symbolOk,
          )}`}
        >
          symbol
        </span>
      </div>
    </div>
  );
}
