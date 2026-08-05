import { useEffect, useState } from 'react';
import api from '../api';
import Icon from './Icon';
import { Modal, Field, ButtonSpinner, useToast } from './ui';

export default function MediaEditModal({ open, item, onClose, onSaved }) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const { show, node } = useToast();

    useEffect(() => {
        if (item) setName(item.name || '');
    }, [item?.id]);

    if (!open || !item) return null;

    const save = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const { data } = await api.put(`/media/${item.id}`, { name: name.trim() });
            show('Nama media diperbarui.');
            onSaved?.(data);
            onClose();
        } catch (e) {
            show(e?.response?.data?.message || 'Gagal memperbarui nama.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Edit Media">
            {node}
            <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3">
                    {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-ink-muted dark:bg-zinc-800">
                            <Icon name={item.type === 'video' ? 'video' : 'file'} size={20} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                        <p className="truncate text-xs text-ink-muted">{item.file_name}</p>
                    </div>
                </div>

                <Field label="Nama" hint="Label gambar">
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama gambar" autoFocus />
                </Field>

                <div className="flex justify-end gap-2 pt-1">
                    <button className="btn-outline" onClick={onClose}>
                        Batal
                    </button>
                    <button className="btn-primary" disabled={saving || !name.trim()} onClick={save}>
                        {saving ? <ButtonSpinner /> : <Icon name="check" size={16} />}
                        Simpan
                    </button>
                </div>
            </div>
        </Modal>
    );
}
