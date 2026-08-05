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
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        if (item) setShowInfo(false);
    }, [item?.id]);

    if (!open || !item) return null;

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
                    <button
                        onClick={() => setShowInfo((s) => !s)}
                        className={`absolute right-3 top-3 rounded-full p-2 shadow transition-colors ${
                            showInfo ? 'bg-brand-600 text-white' : 'bg-white/90 text-zinc-700 hover:bg-white'
                        }`}
                        title={showInfo ? 'Sembunyikan info' : 'Tampilkan info'}
                    >
                        <Icon name="more-horizontal" size={18} />
                    </button>
                </div>

                {showInfo && (
                    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface-muted/50 p-4 sm:grid-cols-2">
                        <div>
                            <label className="label">Nama</label>
                            <p className="break-all rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink">{item.name}</p>
                        </div>
                        <div>
                            <label className="label">Nama File</label>
                            <p className="break-all rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-muted">{item.file_name}</p>
                        </div>
                        <div>
                            <label className="label">Tipe</label>
                            <p className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-muted">{item.mime_type}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Ukuran</label>
                                <p className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-muted">{formatSize(item.size)}</p>
                            </div>
                            <div>
                                <label className="label">Diunggah</label>
                                <p className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-muted">{formatDate(item.created_at)}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <button
                        className="btn-outline"
                        onClick={() => setShowInfo((s) => !s)}
                    >
                        <Icon name="more-horizontal" size={16} /> Info
                    </button>
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
