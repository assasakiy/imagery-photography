import Icon from '../../../components/Icon';
import { formatDate, formatRupiah } from '../../../components/ui';

export default function ArchivedStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, isAdmin, previewLink, copyPreviewLink, setShareOpen, feeMap, setFeeMap, reviewRedelivery, setRerequestOpen, restore, saving } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="folder-open"
                iconCls="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                title="Pesanan Diarsipkan"
                subtitle="Pesanan ini telah diarsipkan."
            />
            <div className="p-5">
                <p className="text-sm text-ink-muted">File proyek telah diarsipkan karena masa retensi berakhir atau atas permintaan admin. Hubungi admin bila Anda masih membutuhkan akses.</p>

                {isAdmin && (
                    <div className="mt-5 rounded-xl border border-line bg-surface-muted/30 p-4">
                        <p className="mb-2 text-sm font-semibold text-ink">Link akses</p>
                        <div className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{previewLink}</span>
                            <button type="button" className="btn-outline shrink-0 !px-2 !py-1 text-xs" onClick={copyPreviewLink}><Icon name="copy" size={14} /> Salin</button>
                        </div>
                        <button type="button" className="btn-primary mt-3" onClick={() => setShareOpen(true)}><Icon name="send" size={16} /> Kirim Akses</button>
                    </div>
                )}

                {(isAdmin || (project.redeliveries || []).length > 0) && (
                    <div className="mt-5 rounded-xl border border-line bg-surface-muted/30 p-4">
                        <p className="mb-3 text-sm font-semibold text-ink">Permintaan Unduh Ulang</p>
                        {(project.redeliveries || []).length ? (
                            <div className="space-y-2">
                                {project.redeliveries.map((rd) => (
                                    <div key={rd.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                                        <span className={`badge ${rd.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600' : rd.status === 'rejected' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'}`}>
                                            {rd.status}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">{rd.note || (rd.user?.name ?? 'Klien')}{rd.fee ? ` · Biaya ${formatRupiah(rd.fee)}` : ''}</span>
                                        {rd.expires_at && <span className="font-mono text-xs text-ink-muted">s/d {formatDate(rd.expires_at)}</span>}
                                        {isAdmin && rd.status === 'pending' && (
                                            <>
                                                <input type="number" min="0" className="input !w-28 !py-1 text-xs" value={feeMap[rd.id] ?? ''} onChange={(e) => setFeeMap({ ...feeMap, [rd.id]: e.target.value })} placeholder="Biaya (0)" />
                                                <button className="btn-outline !px-2 !py-1 text-xs" onClick={() => reviewRedelivery(rd, 'approved')} disabled={saving}>Setujui</button>
                                                <button className="btn-outline !px-2 !py-1 text-xs text-red-600" onClick={() => reviewRedelivery(rd, 'rejected')} disabled={saving}>Tolak</button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-ink-muted">Belum ada permintaan.</p>
                        )}
                        {!isAdmin && (
                            <button className="btn-primary mt-3" onClick={() => setRerequestOpen(true)} disabled={saving}><Icon name="download" size={16} /> Ajukan Permintaan Unduh Ulang</button>
                        )}
                    </div>
                )}
            </div>
            {isAdmin && project.status === 'archived' && (
                <PanelFooter>
                    <button className="btn-primary" onClick={restore} disabled={saving}><Icon name="refresh" size={16} /> Pulihkan Pesanan</button>
                </PanelFooter>
            )}
        </div>
    );
}