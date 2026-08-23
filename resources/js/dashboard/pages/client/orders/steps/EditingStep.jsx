import Icon from '../../../../components/Icon';

export default function EditingStep({ ctx }) {
    const { PanelHeader, hasPhoto, hasVideo, photoDone, photoTotal, photoPct, videoDone, videoTotal, videoPct } = ctx;
    const totalDone = photoDone + videoDone;
    const totalAll = photoTotal + videoTotal;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="edit"
                iconCls="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                title="Progres Editing"
                subtitle="Tim sedang mengedit file media pesanan Anda — pantau progresnya di sini."
            />
            <div className="p-5">
                <p className="mb-4 text-sm text-ink-muted">
                    Sesi pemotretan selesai. Tim sedang menyunting file — progres akan terus diperbarui di halaman ini.
                </p>

                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {hasPhoto && (
                        <div className="rounded-xl border border-line bg-surface-muted/40 p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Foto Diedit</p>
                            <p className="mt-1 font-mono text-lg font-bold text-ink">
                                {photoDone}<span className="text-sm font-medium text-ink-muted"> / {photoTotal || '-'}</span>
                            </p>
                        </div>
                    )}
                    {hasVideo && (
                        <div className="rounded-xl border border-line bg-surface-muted/40 p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Video Diedit</p>
                            <p className="mt-1 font-mono text-lg font-bold text-ink">
                                {videoDone}<span className="text-sm font-medium text-ink-muted"> / {videoTotal || '-'}</span>
                            </p>
                        </div>
                    )}
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                            <Icon name="images" size={12} /> File Terunggah
                        </p>
                        <p className="mt-1 font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {totalDone}<span className="text-sm font-medium text-ink-muted"> / {totalAll || '-'} file</span>
                        </p>
                    </div>
                </div>

                {hasPhoto && (
                    <div className="mb-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-ink">Progres Foto</span>
                            <span className="font-mono text-sm font-semibold text-ink">{photoPct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${photoPct}%` }} />
                        </div>
                    </div>
                )}
                {hasVideo && (
                    <div className="mb-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-ink">Progres Video</span>
                            <span className="font-mono text-sm font-semibold text-ink">{videoPct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${videoPct}%` }} />
                        </div>
                    </div>
                )}

                <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-muted/60 p-3 text-xs text-ink-muted">
                    <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                    Setelah seluruh file selesai diedit, pesanan masuk ke tahap <b className="mx-1 text-ink">Pembayaran</b>. File final dapat dilihat &amp; diunduh dari halaman Preview setelah pelunasan.
                </p>
            </div>
        </div>
    );
}
