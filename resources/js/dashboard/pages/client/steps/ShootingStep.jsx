import Icon from '../../../components/Icon';
import { Field, formatDate } from '../../../components/ui';

export default function ShootingStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, isAdmin, pastShooting, proofStartUploaded, proofEndUploaded, recordStart, recordEnd, uploading, formLocked, fileRef, uploadEndProof, fieldNote, setFieldNote, setDeleteConfirm, confirmShootingDone, endProof, saving, openChat } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="camera"
                iconCls="bg-sky-500/15 text-sky-600 dark:text-sky-400"
                title="Sesi Berlangsung"
                subtitle={isAdmin ? "Bukti mulai sudah tercatat. Unggah bukti selesai lalu konfirmasi untuk memindahkan proyek ke tahap Editing." : "Sesi pemotretan sedang berlangsung — bukti mulai sesi sudah tercatat."}
            />
            <div className="p-5">
                {!proofStartUploaded && !proofEndUploaded && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-surface-muted/30 p-8 text-center">
                        <Icon name="camera" size={24} className="text-ink-muted" />
                        {pastShooting ? (
                            <>
                                <p className="text-sm font-semibold text-ink">Sesi telah selesai</p>
                                <p className="text-xs text-ink-muted">Sesi telah selesai dan tidak ada file yang diunggah sebagai bukti.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-ink">Belum ada bukti tersedia</p>
                                <p className="text-xs text-ink-muted">Bukti mulai/selesai sesi akan tampil di sini setelah diunggah.</p>
                            </>
                        )}
                    </div>
                )}
                {proofStartUploaded && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
                            <img src={recordStart.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-ink">Bukti mulai sesi</p>
                            <p className="font-mono text-xs text-ink-muted">Diunggah {formatDate(recordStart.created_at)}</p>
                        </div>
                        {isAdmin && !pastShooting && (
                            <button className="ml-auto rounded-lg bg-red-500/10 p-2 text-red-600 transition-colors hover:bg-red-500" onClick={() => setDeleteConfirm(recordStart)} title="Hapus bukti">
                                <Icon name="trash" size={16} />
                            </button>
                        )}
                    </div>
                )}

                {isAdmin && !pastShooting && !proofEndUploaded && (
                    <div className="mt-5">
                        <div className="border-t border-line pt-5">
                            <p className="mb-2 text-sm font-semibold text-ink">Unggah bukti selesai sesi</p>
                            <button className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-6 text-center hover:bg-surface-muted/50" onClick={() => fileRef.current?.click()} disabled={formLocked || uploading}>
                                <Icon name="camera" size={24} className="mb-1 text-ink-muted" />
                                <span className="font-semibold text-ink">{uploading ? 'Mengupload...' : 'Seret 1 foto ke sini atau klik untuk unggah'}</span>
                                <span className="text-xs text-ink-muted">Foto ini menjadi penanda waktu sesi resmi selesai</span>
                            </button>
                            <input ref={fileRef} type="file" className="hidden" onChange={uploadEndProof} disabled={formLocked} />
                        </div>

                        <div className="mt-4">
                            <Field label="Catatan dari lapangan" hint="opsional">
                                <textarea className="input" placeholder="Contoh: cuaca cerah, sesi selesai lebih cepat dari jadwal..." rows="2" value={fieldNote} onChange={(e) => setFieldNote(e.target.value)} disabled={formLocked} />
                            </Field>
                        </div>
                    </div>
                )}

                {proofEndUploaded && (
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
                            <img src={recordEnd.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-ink">Bukti selesai sesi</p>
                            <p className="font-mono text-xs text-ink-muted">Diunggah {formatDate(recordEnd.created_at)}</p>
                        </div>
                        {isAdmin && !pastShooting && (
                            <button className="ml-auto rounded-lg bg-red-500/10 p-2 text-red-600 transition-colors hover:bg-red-500" onClick={() => setDeleteConfirm(recordEnd)} title="Hapus bukti">
                                <Icon name="trash" size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            {isAdmin && !pastShooting && (
                <PanelFooter>
                    <button className="btn-outline mr-auto" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan</button>
                    <button className="btn-primary" onClick={confirmShootingDone} disabled={formLocked || saving || (!endProof && !proofEndUploaded)}>
                        Konfirmasi
                    </button>
                </PanelFooter>
            )}
        </div>
    );
}
