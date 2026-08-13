import Icon from '../../../../components/Icon';
import { formatDate, formatRupiah } from '../../../../components/ui';
import { Link } from 'react-router-dom';

function Stars({ value, size = 16 }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Icon key={n} name="star" size={size} className={n <= value ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
            ))}
        </div>
    );
}

export default function CompletedStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, isPaid, paidAt, previewHref, openReview, existingReview, canReview } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="check"
                iconCls="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                title="Proyek Selesai"
                subtitle="Pesanan Anda telah selesai. File asli tanpa watermark kini tersedia untuk diunduh."
            />
            <div className="space-y-3 p-5">
                <div className="flex items-center gap-3 rounded-xl border border-line p-4">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${isPaid ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                        <Icon name="check" size={14} />
                    </span>
                    <p className="flex-1 text-sm font-medium text-ink">Pembayaran invoice lunas</p>
                    <span className={`badge ${isPaid ? 'bg-emerald-500/15 text-emerald-600' : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400'}`}>
                        {isPaid ? 'TERPENUHI' : 'BELUM'}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {isPaid ? `Dibayar Lunas · ${formatDate(paidAt)}` : 'Menunggu Pelunasan'}
                    </p>
                    <p className="text-xl font-bold text-ink">{formatRupiah(Number(project.price))}</p>
                </div>

                {canReview && (
                    <div className="rounded-xl border border-line bg-surface-muted/30 p-5 text-center">
                        <p className="mb-4 text-sm text-ink-muted">Bagikan pengalaman Anda bekerja bersama kami.</p>
                        <button className="btn-primary" onClick={openReview}><Icon name="star" size={16} /> Berikan Review</button>
                    </div>
                )}

                {existingReview && (
                    <div className="rounded-xl border border-line p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Stars value={existingReview.rating} />
                                <span className="text-xs text-ink-muted">Review Anda</span>
                            </div>
                            <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={openReview}>
                                <Icon name="edit" size={14} /> Edit Review
                            </button>
                        </div>
                        {existingReview.title && <p className="mt-3 font-medium text-ink">{existingReview.title}</p>}
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{existingReview.content}</p>
                    </div>
                )}
            </div>
            {project.status !== 'archived' && (
                <PanelFooter>
                    <Link to={previewHref} className="btn-primary">
                        <Icon name="download" size={16} /> Unduh File
                    </Link>
                </PanelFooter>
            )}
        </div>
    );
}
