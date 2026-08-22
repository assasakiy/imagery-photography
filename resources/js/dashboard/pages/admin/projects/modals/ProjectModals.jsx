import { Field, Modal, Confirm } from '../../../../components/ui';
import Icon from '../../../../components/Icon';

function Stars({ value, onChange }) {
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => onChange?.(n)} disabled={!onChange} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
                    <Icon name="star" size={24} className={n <= value ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
                </button>
            ))}
        </div>
    );
}

export function RerequestModal({ open, onClose, saving, rerequestNote, setRerequestNote, onSubmit }) {
    return (
        <Modal open={open} onClose={onClose} title="Ajukan Permintaan Unduh Ulang" footer={
            <div className="flex justify-end gap-2">
                <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>Batal</button>
                <button type="button" className="btn-primary" onClick={onSubmit} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim Permintaan'}</button>
            </div>
        }>
            <div className="space-y-4">
                <p className="text-sm text-ink-muted">Proyek ini telah diarsipkan. Permintaan akan ditinjau admin; link akses sementara diberikan bila disetujui (mungkin berbayar).</p>
                <Field label="Catatan (opsional)">
                    <textarea className="input min-h-[90px]" placeholder="Alasan / kebutuhan unduh ulang..." value={rerequestNote} onChange={(e) => setRerequestNote(e.target.value)} />
                </Field>
            </div>
        </Modal>
    );
}

export function ReviewModal({ open, onClose, saving, reviewForm, setReviewForm, onSubmit }) {
    return (
        <Modal open={open} onClose={onClose} title="Kirim Review & Testimoni" footer={
            <div className="flex justify-end gap-2">
                <button type="button" className="btn-outline" onClick={onClose}>Batal</button>
                <button type="button" className="btn-primary" onClick={onSubmit} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim Review'}</button>
            </div>
        }>
            <form className="space-y-4">
                <Field label="Rating Keseluruhan" required>
                    <Stars value={reviewForm.rating} onChange={(n) => setReviewForm({ ...reviewForm, rating: n })} />
                </Field>
                <Field label="Seberapa besar kemungkinan Anda merekomendasikan kami? (0-10)" required>
                    <input type="number" min="0" max="10" className="input" value={reviewForm.recommend_score} onChange={(e) => setReviewForm({ ...reviewForm, recommend_score: e.target.value })} />
                </Field>
                <Field label="Judul Singkat" hint="opsional">
                    <input className="input" placeholder="Luar biasa!" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
                </Field>
                <Field label="Ceritakan Pengalaman Anda" required>
                    <textarea className="input min-h-[120px]" placeholder="Bagaimana pelayanan fotografer, dll..." value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} required />
                </Field>
            </form>
        </Modal>
    );
}

export function UploadModal({ open, onClose, uploading, uploadProgress, hasPhoto, hasVideo, photoQueue, setPhotoQueue, thumbFile, setThumbFile, videoForm, setVideoForm, photoRef, videoPreviewRef, videoOriginalRef, PhotoThumbImg, onSubmit }) {
    const removePhoto = (file) => {
        setPhotoQueue((prev) => prev.filter((f) => f !== file));
        if (thumbFile === file) setThumbFile(null);
    };

    return (
        <Modal open={open} onClose={onClose} title="Unggah File Final" wide footer={
            <div className="flex justify-end gap-2">
                <button type="button" className="btn-outline" onClick={onClose} disabled={uploading}>Batal</button>
                <button type="button" className="btn-primary" onClick={onSubmit} disabled={uploading || (!photoQueue.length && !(videoForm.preview && videoForm.original))}>
                    {uploading ? 'Mengunggah…' : 'Unggah'} <Icon name="upload" size={16} />
                </button>
            </div>
        }>
            <div className="space-y-5">
                {hasPhoto && (
                    <div>
                        <p className="text-sm font-semibold text-ink">Foto (bisa banyak)</p>
                        <p className="mt-0.5 text-xs text-ink-muted">Klik foto untuk jadikan Thumbnail Card · ✕ untuk batal pilih.</p>
                        {!photoQueue.length && !uploading && (
                            <button type="button" className="mt-3 btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-5 text-center hover:bg-surface-muted/50" onClick={() => photoRef.current?.click()} disabled={uploading}>
                                <Icon name="upload" size={20} className="mb-1 text-ink-muted" />
                                <span className="font-semibold text-ink">Pilih foto hasil edit</span>
                            </button>
                        )}
                        {photoQueue.length > 0 && !uploading && (
                            <>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    {photoQueue.map((f) => (
                                        <div key={`${f.name}-${f.size}-${f.lastModified}`} onClick={() => setThumbFile(f)} className={`group relative cursor-pointer overflow-hidden rounded-lg border ${thumbFile === f ? 'border-brand-600 ring-2 ring-brand-600' : 'border-line'}`}>
                                            <div className="aspect-square w-full overflow-hidden bg-surface-muted">
                                                <PhotoThumbImg file={f} alt={f.name} className="h-full w-full object-cover" />
                                            </div>
                                            <p className="truncate border-t border-line bg-surface/80 px-2 py-1 text-xs text-ink-muted">{f.name}</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(f); }} className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white" title="Batal pilih">
                                                <Icon name="x" size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-ink-muted">Klik untuk pilih jadi thumbnail {thumbFile ? `→ "${thumbFile.name}" terpilih` : ''}</p>
                            </>
                        )}
                        {uploading && photoQueue.length > 0 && (
                            <div className="mt-3 rounded-xl border border-line bg-surface-muted/30 p-4">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-ink">Mengunggah {photoQueue.length} foto…</span>
                                    <span className="font-mono text-xs text-ink-muted">{uploadProgress}%</span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-strong">
                                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <p className="mt-2 text-xs text-ink-muted">Menunggu selesai — tidak bisa memilih/pilih foto saat pengunggahan berlangsung.</p>
                            </div>
                        )}
                        <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const picked = Array.from(e.target.files || []); if (picked.length) setPhotoQueue((prev) => [...prev, ...picked]); e.target.value = ''; }} disabled={uploading} />
                    </div>
                )}
                {hasVideo && (
                    <div className="border-t border-line pt-4">
                        <p className="text-sm font-semibold text-ink">Video (1 pasang)</p>
                        <p className="mt-0.5 text-xs text-ink-muted">File preview (sudah ber-watermark dari editor) + file original/HD. Original privat.</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <button type="button" className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-4 text-center" onClick={() => videoPreviewRef.current?.click()} disabled={uploading}>
                                <Icon name="video" size={20} className="mb-1 text-ink-muted" />
                                <span className="w-full truncate px-2 text-xs font-semibold text-ink">{videoForm.preview ? videoForm.preview.name : 'File Preview (ber-watermark)'}</span>
                            </button>
                            <input ref={videoPreviewRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoForm({ ...videoForm, preview: e.target.files[0] })} disabled={uploading} />
                            <button type="button" className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-4 text-center" onClick={() => videoOriginalRef.current?.click()} disabled={uploading}>
                                <Icon name="video" size={20} className="mb-1 text-ink-muted" />
                                <span className="w-full truncate px-2 text-xs font-semibold text-ink">{videoForm.original ? videoForm.original.name : 'File Original / HD (privat)'}</span>
                            </button>
                            <input ref={videoOriginalRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoForm({ ...videoForm, original: e.target.files[0] })} disabled={uploading} />
                        </div>
                    </div>
                )}
                {uploading && !photoQueue.length && (
                    <div className="rounded-xl border border-line bg-surface-muted/30 p-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-ink">Mengunggah…</span>
                            <span className="font-mono text-xs text-ink-muted">{uploadProgress}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-strong">
                            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-ink-muted">Menunggu selesai — tidak bisa pilih lagi.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export function ShareModal({ open, onClose, sharing, shareForm, setShareForm, previewLink, onSubmit }) {
    return (
        <Modal open={open} onClose={onClose} title="Kirim Akses" footer={
            <div className="flex justify-end gap-2">
                <button type="button" className="btn-outline" onClick={onClose} disabled={sharing}>Batal</button>
                <button type="button" className="btn-primary" onClick={onSubmit} disabled={sharing}>
                    {sharing ? 'Mengirim...' : (shareForm.enabled ? 'Aktifkan & Kirim' : 'Nonaktifkan')}
                </button>
            </div>
        }>
            <div className="space-y-4">
                <button type="button" onClick={() => setShareForm({ ...shareForm, enabled: !shareForm.enabled })} className="flex w-full items-center justify-between gap-4 rounded-xl border border-line p-4 text-left hover:bg-surface-muted/30">
                    <div>
                        <p className="text-sm font-semibold text-ink">Link akses aktif</p>
                        <p className="mt-0.5 text-xs text-ink-muted">Klien dapat membuka link untuk mengakses file.</p>
                    </div>
                    <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${shareForm.enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shareForm.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </span>
                </button>

                {shareForm.enabled && (
                    <>
                        <Field label="Masa berlaku link">
                            <select className="input" value={shareForm.expires_days} onChange={(e) => setShareForm({ ...shareForm, expires_days: e.target.value })}>
                                <option value="3">3 hari</option>
                                <option value="7">7 hari</option>
                                <option value="30">30 hari</option>
                            </select>
                        </Field>
                        <div>
                            <p className="mb-1 text-xs text-ink-muted">Link yang dikirim:</p>
                            <p className="truncate rounded-lg border border-line bg-surface-muted/30 p-2 font-mono text-xs text-ink">{previewLink}</p>
                        </div>
                    </>
                )}

                <p className="text-xs text-ink-muted">Pengiriman mengikuti aturan notifikasi yang aktif (WhatsApp / email / dalam aplikasi) sesuai preferensi klien.</p>
            </div>
        </Modal>
    );
}

export function DeleteConfirm({ open, item, onClose, onConfirm }) {
    return <Confirm open={open} onClose={onClose} onConfirm={onConfirm} title="Hapus file?" message={`File "${item?.original_name || ''}" akan dihapus dari server.`} />;
}

export function ArchiveConfirm({ open, onClose, onConfirm }) {
    return <Confirm open={open} onClose={onClose} onConfirm={onConfirm} title="Arsipkan Pesanan?" message="Pesanan akan dipindahkan ke arsip. Klien masih bisa mengajukan permintaan unduh ulang." />;
}
