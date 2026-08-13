import Icon from '../../../../components/Icon';
import { formatDate, formatRupiah, formatTimeRange } from '../../../../components/ui';

export default function ScheduledStep({ ctx }) {
    const { PanelHeader, project, pastScheduled } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="calendar"
                iconCls="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                title="Detail Pesanan"
                subtitle={pastScheduled ? 'Pesanan Anda sudah melewati tahap penjadwalan.' : 'Detail pesanan Anda. Status berpindah ke Pemotretan setelah sesi acara dimulai.'}
            />
            <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-ink-muted">No. Pesanan</p><p className="font-mono text-sm font-semibold text-ink">{project.order_no ? `PSN-${project.order_no}` : '-'}</p></div>
                    <div><p className="text-xs text-ink-muted">Paket</p><p className="text-sm font-semibold text-ink">{project.package || 'Layanan Satuan / Kustom'}</p></div>
                    <div><p className="text-xs text-ink-muted">Tanggal Acara</p><p className="text-sm font-semibold text-ink">{project.event_start ? formatDate(project.event_start) : (project.event_date ? formatDate(project.event_date) : '-')}</p></div>
                    <div><p className="text-xs text-ink-muted">Waktu Acara</p>
                        <p className="text-sm font-semibold text-ink">
                            {formatTimeRange(project.event_start, project.event_end)}
                        </p>
                    </div>
                    <div><p className="text-xs text-ink-muted">Lokasi</p><p className="text-sm font-semibold text-ink">{project.location || '-'}</p></div>
                    <div><p className="text-xs text-ink-muted">Harga</p><p className="text-sm font-semibold text-ink">{project.price ? formatRupiah(project.price) : '-'}</p></div>
                    <div><p className="text-xs text-ink-muted">Dibuat</p><p className="text-sm font-semibold text-ink">{formatDate(project.created_at)}</p></div>
                    <div><p className="text-xs text-ink-muted">Klien</p>
                        <p className="text-sm font-semibold text-ink">
                            {project.user?.username ? `@${project.user.username}` : (project.user?.name || '-')}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-ink-muted">Catatan</p>
                        <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-ink">{project.description || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}