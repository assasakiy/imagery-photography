import { Field } from '../../../../components/ui';

export function statLabel(s) {
    const base = s.label || `Stat #${s.id}`;
    const value = s.resolved_value;
    if (value != null && value !== '') {
        return `${base} — ${value}${s.suffix || ''}`;
    }
    return base;
}

export function ReviewChecklist({ reviews, items = [], onToggle, emptyHint }) {
    if (!reviews.length) {
        return (
            <Field label="Daftar Review">
                <div className="rounded-lg border border-line bg-surface-muted/50 p-4 text-sm text-ink-muted">{emptyHint}</div>
            </Field>
        );
    }

    return (
        <Field label={`Daftar Review (${reviews.length})`} hint="Hapus centang review yang tidak ingin ditampilkan.">
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-line bg-surface-muted/50 p-3">
                {reviews.map((r) => (
                    <label key={r.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-line text-brand-600"
                            checked={items.includes(r.id)}
                            onChange={() => onToggle(r.id)}
                        />
                        <span className="min-w-0 flex-1 truncate">{r.name}</span>
                        <span className="shrink-0 text-xs tracking-tight text-amber-500">{'★'.repeat(Math.max(0, Math.min(5, r.rating || 0)))}</span>
                    </label>
                ))}
            </div>
        </Field>
    );
}