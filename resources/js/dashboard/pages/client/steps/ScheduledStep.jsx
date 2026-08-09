import Icon from '../../../components/Icon';
import { formatDate, formatRupiah } from '../../../components/ui';

export default function ScheduledStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, isAdmin, pastScheduled, proofStartUploaded, recordStart, uploading, formLocked, fileRef, uploadFile, setDeleteConfirm, openChat, advance, saving } = ctx;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="calendar"
                iconCls="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                title="Detail Proyek"
                subtitle={isAdmin ? "Data ini diisi saat proyek dibuat. Status berpindah ke Pemotretan setelah fotografer mengunggah bukti mulai sesi." : "Detail pesanan Anda. Status berpindah ke Pemotretan setelah sesi acara dimulai."}
            />
            <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-ink-muted">No. Pesanan</p><p className="font-mono text-sm font-semibold text-ink">{project.order_no ? `PSN-${project.order_no}` : '-'}</p></div>
                    <div><p className="text-xs text-ink-muted">Paket</p><p className="text-sm font-semibold text-ink">{project.package ? project.package.name : (project.pricing_snapshot?.package || 'Layanan Satuan / Kustom')}</p></div>
                    <div><p className="text-xs text-ink-muted">Tanggal Acara</p><p className="text-sm font-semibold text-ink">{project.event_start ? formatDate(project.event_start) : (project.event_date ? formatDate(project.event_date) : '-')}</p></div>
                    <div><p className="text-xs text-ink-muted">Waktu Acara</p>
                        <p className="text-sm font-semibold text-ink">
                            {project.event_start ? project.event_start.slice(11, 16) : '-'} 
                            {project.event_end ? ` - ${project.event_end.slice(11, 16)}` : ''}
                            {!project.event_start && !project.event_end ? '-' : ''}
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

                {isAdmin && project.event_start && new Date(project.event_start) < new Date() && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
                        <Icon name="calendar" size={20} className="shrink-0 text-amber-600" />
                        <div className="text-sm">
                            <p className="font-bold">Acara sudah lewat jadwal mulainya.</p>
                            <p className="opacity-90">Ingatkan fotografer untuk mengunggah bukti mulai sesi.</p>
                        </div>
                    </div>
                )}

                {isAdmin && !pastScheduled && !proofStartUploaded && (
                    <div className="mt-6 border-t border-line pt-4">
                        <p className="mb-2 text-sm font-semibold text-ink">Unggah bukti mulai sesi</p>
                        <button className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-6 text-center hover:bg-surface-muted/50" onClick={() => fileRef.current?.click()} disabled={formLocked || uploading}>
                            <Icon name="camera" size={24} className="mb-1 text-ink-muted" />
                            <span className="font-semibold text-ink">{uploading ? 'Mengupload...' : 'Seret foto ke sini atau klik untuk unggah'}</span>
                            <span className="text-xs text-ink-muted">Foto ini menjadi penanda waktu sesi resmi dimulai</span>
                        </button>
                        <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadFile(e, 'start')} disabled={formLocked} />
                    </div>
                )}

                {isAdmin && proofStartUploaded && (
                    <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-surface-muted/30 p-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
                            <img src={recordStart.url} alt="Bukti mulai sesi" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-ink">Bukti mulai sesi</p>
                            <p className="font-mono text-xs text-ink-muted">Diunggah {formatDate(recordStart.created_at)}</p>
                        </div>
                        {!pastScheduled && (
                            <button className="ml-auto rounded-lg bg-red-500/10 p-2 text-red-600 transition-colors hover:bg-red-500" onClick={() => setDeleteConfirm(recordStart)} title="Hapus bukti">
                                <Icon name="trash" size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            {isAdmin && !pastScheduled && (
                <PanelFooter>
                    <button className="btn-outline mr-auto" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan</button>
                    <button className="btn-primary" onClick={advance} disabled={formLocked || saving}>
                        Konfirmasi
                    </button>
                </PanelFooter>
            )}
        </div>
    );
}
