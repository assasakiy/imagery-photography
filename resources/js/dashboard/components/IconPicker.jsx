import { useMemo, useState } from 'react';
import Icon, { ICON_NAMES } from './Icon';
import { Modal } from './ui';

const EXCLUDE = ['none'];

export default function IconPicker({ open, onClose, value, onSelect, title = 'Pilih Ikon' }) {
    const [search, setSearch] = useState('');

    const icons = useMemo(() => {
        const q = search.trim().toLowerCase();
        return ICON_NAMES.filter((name) => !EXCLUDE.includes(name) && (!q || name.includes(q)));
    }, [search]);

    const choose = (name) => {
        onSelect?.(name);
        setSearch('');
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title={title} wide>
            <input
                className="input mb-4"
                placeholder="Cari ikon…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
            />
            <div className="grid max-h-[50vh] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6 md:grid-cols-8">
                {icons.map((name) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => choose(name)}
                        className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border transition-colors ${
                            value === name
                                ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-400'
                                : 'border-line text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                        title={name}
                    >
                        <Icon name={name} size={22} />
                        <span className="w-full truncate px-1 text-[10px]">{name}</span>
                    </button>
                ))}
            </div>
            {!icons.length && <p className="py-8 text-center text-sm text-ink-muted">Ikon tidak ditemukan.</p>}
        </Modal>
    );
}
