import { useEffect, useState } from 'react';
import { Modal, formatDate } from './ui';
import Icon from './Icon';

const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export default function MediaViewModal({ open, item, onClose, onEdit, onCopyUrl }) {
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => {
        if (item) setInfoOpen(false);
    }, [item?.id]);

    if (!open || !item) return null;

    const rows = [
        { label: 'Nama', value: item.name },
        { label: 'Nama File', value: item.file_name },
        { label: 'Tipe', value: item.mime_type },
        { label: 'Ukuran', value: formatSize(item.size) },
        { label: 'Diunggah', value: formatDate(item.created_at) },
    ];

    return (
        <Modal open={open} onClose={onClose} title="Pratinjau Media" wide>
            <div className="space-y-4">
                <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-black/40">
                    {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="max-h-[45vh] w-full object-contain" />
                    ) : (
                        <div className="flex h-48 w-full items-center justify-center text-ink-muted">
                            <Icon name={item.type === 'video' ? 'video' : 'file'} size={48} />
                        </div>
                    )}

                    {infoOpen && (
                        <div className="absolute inset-0 z-10 overflow-y-auto bg-black/85 p-4 backdrop-blur-sm sm:p-6">
                            <div className="mx-auto max-w-xl">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">Detail File</p>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {rows.map((row) => (
                                        <div key={row.label}>
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">{row.label}</p>
                                            <p className="break-all text-sm text-white">{row.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setInfoOpen((s) => !s)}
                        className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-2 text-zinc-700 shadow transition-colors hover:bg-white"
                        title="Info"
                    >
                        <Icon name="more-horizontal" size={18} />
                    </button>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                        <Icon name="eye" size={16} /> Buka
                    </a>
                    <button className="btn-outline" onClick={() => onCopyUrl?.(item.url)}>
                        <Icon name="link" size={16} /> Salin URL
                    </button>
                    <button className="btn-primary" onClick={() => onEdit?.(item)}>
                        <Icon name="edit" size={16} /> Edit
                    </button>
                </div>
            </div>
        </Modal>
    );
}
