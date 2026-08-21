import { useEffect, useState } from 'react';
import api from '../api';
import Icon from './Icon';
import { Modal, Field, ButtonSpinner } from './ui';
import { toast } from '../lib/toast';
import { getApiErrorMessage } from '../lib/errors';

export default function MediaEditModal({ open, item, onClose, onSaved }) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) setName(item.name || '');
    }, [item?.id]);

    if (!open || !item) return null;

    const save = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const { data } = await api.put(`/media/${item.id}`, { name: name.trim() });
            toast.success('Nama media diperbarui.');
            onSaved?.(data);
            onClose();
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Gagal memperbarui nama.'));
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <button className="btn-outline" onClick={onClose}>
                Batal
            </button>
            <button className="btn-primary" disabled={saving || !name.trim()} onClick={save}>
                {saving ? <ButtonSpinner /> : <Icon name="check" size={16} />}
                Simpan
            </button>
        </div>
    );

    return (
        <Modal open={open} onClose={onClose} title="Edit Media" footer={footer}>
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
            </div>
        </Modal>
    );
}
