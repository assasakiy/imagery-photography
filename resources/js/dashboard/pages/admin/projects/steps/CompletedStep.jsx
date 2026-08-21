import Icon from '../../../../components/Icon';
import { formatDate, formatRupiah } from '../../../../components/ui';

export default function CompletedStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, isPaid, paidAt, setConfirmArchive, saving } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="check"
                iconCls="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                title="Proyek Selesai"
                subtitle="Kedua syarat berikut sudah terpenuhi. File asli tanpa watermark kini tersedia untuk diunduh."
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
            </div>
            <PanelFooter>
                <button className="btn-outline" onClick={() => setConfirmArchive(true)} disabled={saving}>
                    <Icon name="folder-open" size={16} /> Arsipkan Proyek
                </button>
            </PanelFooter>
        </div>
    );
}