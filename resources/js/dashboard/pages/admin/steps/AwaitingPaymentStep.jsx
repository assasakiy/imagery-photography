import Icon from '../../../components/Icon';
import { formatDate, formatRupiah } from '../../../components/ui';
import { Link } from 'react-router-dom';

export default function AwaitingPaymentStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, isAdmin, previewLink, copyPreviewLink, previewHref, isPaid, advance, formLocked, saving } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="eye"
                iconCls="bg-orange-500/15 text-orange-600 dark:text-orange-400"
                title="Preview & Invoice"
                subtitle="File final sudah diunggah. Link pratinjau dan invoice dibuat otomatis — tinjau dulu sebelum membagikannya ke klien."
            />
            <div className="p-5">
                {isAdmin && (
                    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-muted/30 p-3">
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{previewLink}</span>
                        <button type="button" className="btn-outline shrink-0 !px-2 !py-1 text-xs" onClick={copyPreviewLink}><Icon name="copy" size={14} /> Salin</button>
                        <a className="btn-outline shrink-0 !px-2 !py-1 text-xs" href={previewLink} target="_blank" rel="noreferrer"><Icon name="globe" size={14} /> Buka</a>
                    </div>
                )}
                {!isAdmin && project.invoice ? (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div>
                            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Invoice Terkirim · {project.invoice.number}</p>
                            <p className="mt-1 text-xl font-bold text-ink">{formatRupiah(project.invoice.base_amount)}</p>
                        </div>
                        <div className="text-right text-xs text-emerald-700 dark:text-emerald-400">
                            <p>Jatuh tempo</p>
                            <p className="mt-0.5 font-semibold">{formatDate(project.invoice.due_at)}</p>
                        </div>
                    </div>
                ) : null}
                <p className="mt-4 text-xs text-ink-muted">
                    Status berpindah ke <b>Selesai</b> otomatis setelah pembayaran invoice lunas.
                </p>
            </div>
            <PanelFooter>
                <Link to={previewHref} className="btn-outline"><Icon name="eye" size={16} /> Lihat Preview</Link>
                {!isAdmin && (
                    <Link to="/dashboard/client-invoices" className="btn-primary"><Icon name="credit-card" size={16} /> Bayar Tagihan</Link>
                )}
                {isAdmin && isPaid && (
                    <button className="btn-primary" onClick={advance} disabled={formLocked || saving}>
                        Tandai Selesai
                    </button>
                )}
            </PanelFooter>
        </div>
    );
}
