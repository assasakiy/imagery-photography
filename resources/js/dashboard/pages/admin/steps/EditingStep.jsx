import Icon from '../../../components/Icon';
import { Field } from '../../../components/ui';
import { Link } from 'react-router-dom';

export default function EditingStep({ ctx }) {
    const {
        PanelHeader, PanelFooter, PhotoThumbImg, project, isAdmin, pastEditing,
        hasPhoto, hasVideo, photoDone, photoTotal, photoPct, videoDone, videoTotal, videoPct,
        photoAssetCount, videoAssetCount, previewHref, editForm, setEditForm, saveEditProgress,
        formLocked, saving, progressUpdates, fmtLog, editNote, setEditNote, addEditNote,
        uploadLabel, setUploadOpen, thumbFile, pickAndSaveThumb, thumbRef, uploading,
        editAllDone, editDoneTotal, editGrandTotal, openChat, advance,
    } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="edit"
                iconCls="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                title="Progres Editing"
                subtitle={isAdmin ? "Perbarui jumlah media dan progres yang sudah diedit secara berkala. Klien dapat melihat ringkasan progres ini." : "Tim sedang mengedit file media pesanan Anda — pantau progresnya di sini."}
            />
            <div className="p-5">
                {hasPhoto && (
                    <div className="mb-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-ink">Foto diedit</span>
                            <span className="font-mono text-sm font-semibold text-ink">{photoDone} / {photoTotal}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${photoPct}%` }} />
                        </div>
                    </div>
                )}
                {hasVideo && (
                    <div className="mb-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-ink">Video diedit</span>
                            <span className="font-mono text-sm font-semibold text-ink">{videoDone} / {videoTotal}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${videoPct}%` }} />
                        </div>
                    </div>
                )}
                {isAdmin && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-muted/30 px-4 py-3 text-sm">
                        <Icon name="images" size={16} className="text-ink-muted" />
                        <span className="font-medium text-ink">{photoAssetCount} foto · {videoAssetCount} video diupload</span>
                        <span className="text-xs text-ink-muted">— kelola di halaman <Link to={previewHref} className="text-brand-600 underline">Preview</Link></span>
                    </div>
                )}
                {isAdmin && (
                    <>
                        {!pastEditing && (
                        <form onSubmit={saveEditProgress} className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5">
                            {hasPhoto && (
                                <>
                                    <Field label="Total foto">
                                        <input className="input" type="number" min="0" value={editForm.photo_total} onChange={(e) => setEditForm({ ...editForm, photo_total: e.target.value })} placeholder="mis. 480" disabled={formLocked} />
                                    </Field>
                                    <Field label="Foto sudah diedit">
                                        <input className="input" type="number" min="0" value={editForm.photo_done} onChange={(e) => setEditForm({ ...editForm, photo_done: e.target.value })} placeholder="mis. 210" disabled={formLocked} />
                                    </Field>
                                </>
                            )}
                            {hasVideo && (
                                <>
                                    <Field label="Total video">
                                        <input className="input" type="number" min="0" value={editForm.video_total} onChange={(e) => setEditForm({ ...editForm, video_total: e.target.value })} placeholder="mis. 3" disabled={formLocked} />
                                    </Field>
                                    <Field label="Video sudah diedit">
                                        <input className="input" type="number" min="0" value={editForm.video_done} onChange={(e) => setEditForm({ ...editForm, video_done: e.target.value })} placeholder="mis. 1" disabled={formLocked} />
                                    </Field>
                                </>
                            )}
                            <div className="col-span-2">
                                <button className="btn-primary" disabled={formLocked || saving}>{saving ? 'Menyimpan...' : 'Simpan Progres'}</button>
                            </div>
                        </form>
                        )}
                        <div className="mt-5 border-t border-line pt-5">
                            <p className="mb-3 text-sm font-semibold text-ink">Riwayat pembaruan</p>
                            <div className="space-y-3">
                                {progressUpdates.length ? (
                                    progressUpdates.map((u) => (
                                        <div key={u.id} className="flex items-baseline gap-3">
                                            <span className="shrink-0 font-mono text-xs text-ink-muted">{fmtLog(u.created_at)}</span>
                                            <span className="text-sm text-ink-muted">{u.message.replace(/^Proses editing:\s*/, '')}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-ink-muted">Belum ada pembaruan tercatat.</p>
                                )}
                            </div>
                            {!pastEditing && (
                            <div className="mt-3 flex gap-2">
                                <input className="input" placeholder="Tulis pembaruan progres..." value={editNote} onChange={(e) => setEditNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditNote(); } }} disabled={formLocked} />
                                <button className="btn-outline shrink-0" onClick={addEditNote} disabled={formLocked || !editNote.trim()}>Tambah</button>
                            </div>
                            )}
                        </div>
                        <div className="mt-5">
                            <p className="mb-0.5 text-sm font-semibold text-ink">Unggah File Final</p>
                            <p className="mb-3 text-xs text-ink-muted">File final = aset klien, tampil di halaman <Link to={previewHref} className="text-brand-600 underline">Preview</Link>.</p>
                            {!pastEditing && (
                                <div className="overflow-hidden rounded-xl border border-line">
                                    <button type="button" onClick={() => setUploadOpen(true)} disabled={formLocked || uploading} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left hover:bg-surface-muted/40 disabled:opacity-50">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                            <Icon name="upload" size={18} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-ink">{uploadLabel}</span>
                                            <span className="block text-xs text-ink-muted">Buka popup untuk pilih file hasil edit</span>
                                        </span>
                                        <Icon name="arrow-right" size={16} className="shrink-0 text-ink-muted" />
                                    </button>
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-strong">
                                            {thumbFile ? (
                                                <PhotoThumbImg file={thumbFile} alt="Thumbnail" className="h-full w-full object-cover" />
                                            ) : project.thumb_url ? (
                                                <img src={project.thumb_url} alt="Thumbnail" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="px-1 text-center text-[10px] text-ink-muted">Belum ada</span>
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-ink">Thumbnail Card</span>
                                            <span className="block truncate text-xs text-ink-muted">{thumbFile ? `Baru: ${thumbFile.name}` : 'Tampil permanen di card Preview klien'}</span>
                                        </span>
                                        <button type="button" className="btn-outline shrink-0 !px-3 !py-1 text-xs" onClick={() => thumbRef.current?.click()} disabled={formLocked || uploading}>Ganti</button>
                                        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={pickAndSaveThumb} disabled={uploading} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            {isAdmin && !pastEditing && (
                <PanelFooter>
                    <button className="btn-outline mr-auto" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan</button>
                    <button className="btn-primary" onClick={advance} disabled={formLocked || saving || !editAllDone}>
                        Konfirmasi
                    </button>
                </PanelFooter>
            )}
            {isAdmin && !editAllDone && !pastEditing && (
                <div className="border-t border-line bg-surface-muted/50 px-5 py-3">
                    <p className="text-xs text-ink-muted">
                        {editGrandTotal > 0
                            ? `Aktif setelah seluruh media ditandai selesai diedit (saat ini ${editDoneTotal}/${editGrandTotal}).`
                            : 'Aktif setelah kamu mengisi total media dan menandainya selesai diedit.'}
                    </p>
                </div>
            )}
        </div>
    );
}
