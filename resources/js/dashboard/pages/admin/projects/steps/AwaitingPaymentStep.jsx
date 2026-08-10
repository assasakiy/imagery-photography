import Icon from '../../../../components/Icon';
import { formatDate, formatRupiah } from '../../../../components/ui';
import { Link } from 'react-router-dom';

export default function AwaitingPaymentStep({ ctx }) {
    const { PanelHeader, PanelFooter, isAdmin, previewLink, copyPreviewLink, previewHref, isPaid, advance, formLocked, saving } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="eye"
                iconCls="bg-orange-500/15 text-orange-600 dark:text-orange-400"
                title="Preview & Invoice"
                subtitle="File final sudah diunggah. Link pratinjau dan invoice dibuat otomatis — tinjau dulu sebelum membagikannya ke klien."
            />
            <div className="p-5">
                <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-muted/30 p-3">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{previewLink}</span>
                    <button type="button" className="btn-outline shrink-0 !px-2 !py-1 text-xs" onClick={copyPreviewLink}><Icon name="copy" size={14} /> Salin</button>
                    <a className="btn-outline shrink-0 !px-2 !py-1 text-xs" href={previewLink} target="_blank" rel="noreferrer"><Icon name="globe" size={14} /> Buka</a>
                </div>
                <p className="mt-4 text-xs text-ink-muted">
                    Status berpindah ke <b>Selesai</b> otomatis setelah pembayaran invoice lunas.
                </p>
            </div>
            <PanelFooter>
                <Link to={previewHref} className="btn-outline"><Icon name="eye" size={16} /> Lihat Preview</Link>
                {isAdmin && isPaid && (
                    <button className="btn-primary" onClick={advance} disabled={formLocked || saving}>
                        Tandai Selesai
                    </button>
                )}
            </PanelFooter>
        </div>
    );
}
