'use client'

interface CodeBoxProps {
  value: string
  onChange: (value: string) => void
  label?: string
  helper?: string
  error?: string
  maxLength?: number
}

export function CodeBox({
  value,
  onChange,
  label,
  helper,
  error,
  maxLength,
}: CodeBoxProps) {
  const normalized = value.toLowerCase().replace(/\s/g, '')

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      <div
        role="textbox"
        aria-multiline="false"
        className="relative group"
      >
        <input
          type="text"
          value={normalized}
          onChange={(e) => {
            const raw = e.target.value
            // Strip non-alphanumeric, lowercase
            const cleaned = raw.replace(/[^a-z0-9]/gi, '').toLowerCase()
            onChange(cleaned)
          }}
          maxLength={maxLength}
          autoComplete="off"
          spellCheck={false}
          className="w-full font-mono text-sm text-text bg-surface border border-line rounded-[4px] px-4 py-3 focus:outline-none focus:ring-0 disabled:opacity-50"
          disabled={error ? undefined : undefined}
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <span
            className={`font-mono text-xs font-bold transition-colors ${
              normalized.length > 0
                ? normalized.length >= (maxLength || 20)
                  ? 'text-success'
                  : 'text-accent-text'
                : 'text-text-muted'
            }`}
          >
            {normalized.length}
          </span>
        </div>
      </div>
      {error && (
        <span className="flex items-center gap-1 font-mono text-xs text-danger">
          <span aria-hidden="true">!</span> {error}
        </span>
      )}
      {!error && helper && (
        <span className="font-mono text-xs text-text-muted">{helper}</span>
      )}
      <p className="font-mono text-xs text-text-muted">
        Case and spaces ignored &middot;{" "}
        {normalized.length > 0 && normalized.length <= 2
          ? 'close!'
          : normalized.length > 2
            ? 'keep going'
            : 'enter code'}
      </p>
    </div>
  )
}
