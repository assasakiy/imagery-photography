import Icon from '../../../components/Icon';
import { formatDate } from '../../../components/ui';

export default function ShootingStep({ ctx }) {
    const { PanelHeader, pastShooting, proofStartUploaded, proofEndUploaded, recordStart, recordEnd } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="camera"
                iconCls="bg-sky-500/15 text-sky-600 dark:text-sky-400"
                title="Sesi Berlangsung"
                subtitle="Sesi pemotretan sedang berlangsung — bukti mulai sesi sudah tercatat."
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
                    </div>
                )}
            </div>
        </div>
    );
}