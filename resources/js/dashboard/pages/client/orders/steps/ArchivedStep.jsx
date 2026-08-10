import Icon from '../../../../components/Icon';
import { formatDate, formatRupiah } from '../../../../components/ui';

export default function ArchivedStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, setRerequestOpen, saving } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="folder-open"
                iconCls="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                title="Pesanan Diarsipkan"
                subtitle="Pesanan ini telah diarsipkan."
            />
            <div className="p-5">
                <p className="text-sm text-ink-muted">File proyek telah diarsipkan karena masa retensi berakhir. Untuk akses unduhan, ajukan permintaan di bawah ini.</p>

                {(project.redeliveries || []).length > 0 && (
                    <div className="mt-5 rounded-xl border border-line bg-surface-muted/30 p-4">
                        <p className="mb-3 text-sm font-semibold text-ink">Status Permintaan Unduh Ulang</p>
                        <div className="space-y-2">
                            {project.redeliveries.map((rd) => (
                                <div key={rd.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                                    <span className={`badge ${rd.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600' : rd.status === 'rejected' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'}`}>
                                        {rd.status}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">{rd.note || 'Tanpa catatan'}{rd.fee ? ` · Biaya ${formatRupiah(rd.fee)}` : ''}</span>
                                    {rd.expires_at && <span className="font-mono text-xs text-ink-muted">aktif s/d {formatDate(rd.expires_at)}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button className="btn-primary mt-5" onClick={() => setRerequestOpen(true)} disabled={saving}><Icon name="download" size={16} /> Ajukan Permintaan Unduh Ulang</button>
            </div>
            <PanelFooter>
                <Icon name="folder-open" size={16} className="text-ink-muted" />
                <span className="text-xs text-ink-muted">Hubungi admin bila membutuhkan bantuan.</span>
            </PanelFooter>
        </div>
    );
}