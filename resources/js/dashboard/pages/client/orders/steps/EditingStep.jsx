export default function EditingStep({ ctx }) {
    const { PanelHeader, hasPhoto, hasVideo, photoDone, photoTotal, photoPct, videoDone, videoTotal, videoPct } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="edit"
                iconCls="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                title="Progres Editing"
                subtitle="Tim sedang mengedit file media pesanan Anda — pantau progresnya di sini."
            />
            <div className="p-5">
                <p className="mb-4 text-sm text-ink-muted">Sesi pemotretan selesai. Tim sedang menyunting file — progres akan terus diperbarui.</p>
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
            </div>
        </div>
    );
}