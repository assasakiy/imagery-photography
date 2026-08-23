import { useState, useRef } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { Field, ButtonSpinner } from '../../components/ui';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';

export default function PayInvoiceConfirm({ invoice, method, onSuccess }) {
    const [form, setForm] = useState({ notes: '', proof: null });
    const [saving, setSaving] = useState(false);
    const proofRef = useRef(null);
    
    // Preview image
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, proof: file });
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setForm({ ...form, proof: null });
        setPreview(null);
        if (proofRef.current) proofRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.proof) {
            return toast.error('Bukti pembayaran wajib diunggah.');
        }

        setSaving(true);
        const data = new FormData();
        data.append('amount', invoice.remaining);
        data.append('method', 'manual_transfer');
        
        let notesText = '';
        if (method.data.gtype === 'qris') {
            notesText = `Bayar via QRIS ${method.data.item.merchant || ''}`.trim();
        } else {
            notesText = `Transfer ke ${method.data.item.name} ${method.data.item.number}`;
        }
        if (form.notes) notesText += ` - ${form.notes}`;
        data.append('notes', notesText);

        data.append('proof_file', form.proof);

        data.append('channel_type', method.data.gtype || '');
        data.append('channel_label', method.data.item.merchant || method.data.item.name || '');
        data.append('account_number', method.data.item.number || '');
        data.append('account_name', method.data.item.holder || '');

        try {
            await api.post(`/projects/${invoice.project_id}/payments`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Bukti pembayaran berhasil diunggah.');
            onSuccess();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengunggah pembayaran.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-xl">
            <form onSubmit={handleSubmit} className="card p-6">
                <div className="text-center mb-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                        <Icon name="upload" size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-ink">Unggah Bukti Pembayaran</h3>
                    <p className="mt-2 text-sm text-ink-muted">
                        Pastikan tanggal, rekening tujuan, dan nominal pada struk/bukti transfer terlihat jelas.
                    </p>
                </div>

                <div className="mb-6">
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={proofRef}
                        onChange={handleFileChange}
                    />
                    
                    {!preview ? (
                        <div 
                            onClick={() => proofRef.current?.click()}
                            className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface-muted py-12 transition-colors hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/10"
                        >
                            <Icon name="image" size={32} className="text-ink-muted group-hover:text-brand-500" />
                            <span className="font-medium text-ink">Pilih File Foto/PDF</span>
                            <span className="text-xs text-ink-muted">Maks. 10MB</span>
                        </div>
                    ) : (
                        <div className="relative overflow-hidden rounded-xl border border-line bg-surface-muted p-2">
                            {form.proof?.type?.includes('image') ? (
                                <img src={preview} alt="Preview" className="h-48 w-full rounded-lg object-contain bg-black/5" />
                            ) : (
                                <div className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-lg bg-white dark:bg-zinc-800">
                                    <Icon name="file-text" size={40} className="text-ink-muted" />
                                    <span className="font-mono text-sm text-ink">{form.proof.name}</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={removeFile}
                                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                            >
                                <Icon name="x" size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <Field label="Catatan Tambahan (Opsional)">
                    <textarea
                        className="input min-h-[80px]"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Misal: Atas nama Budi, transfer dari BNI..."
                    />
                </Field>

                <div className="mt-8 flex gap-3">
                    <button 
                        type="submit" 
                        disabled={saving || !form.proof} 
                        className="btn-primary w-full justify-center py-3 text-sm"
                    >
                        {saving ? <ButtonSpinner /> : 'Kirim Bukti Pembayaran'}
                    </button>
                </div>
            </form>
        </div>
    );
}
