import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast, formatDate } from '../components/ui';

const emptyForm = { name: '', email: '', phone: '', company: '', occupation: '' };

export default function Clients() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [creds, setCreds] = useState(null);
    const [credLoading, setCredLoading] = useState(false);
    const [issuing, setIssuing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [inviteHours, setInviteHours] = useState('');
    const { show, node } = useToast();

    const openCreds = async (item) => {
        setCredLoading(true);
        try {
            const { data } = await api.get(`/clients/${item.id}/credentials`);
            setCreds(data);
        } catch {
            show('Gagal memuat kredensial.', 'error');
        } finally {
            setCredLoading(false);
        }
    };

    const issueToken = async (purpose, send = true) => {
        if (!creds) return;
        setIssuing(purpose);
        try {
            const { data } = await api.post(`/clients/${creds.id}/token/${purpose}`, { send, expires_hours: inviteHours || undefined });
            show(purpose === 'invite' ? 'Undangan dibuat & dikirim.' : 'Tautan dibuat' + (send ? ' & dikirim.' : '.'));
            openCreds({ id: creds.id });
        } catch {
            show('Gagal membuat tautan.', 'error');
        } finally {
            setIssuing(null);
        }
    };

    const toggleStatus = async (id, status) => {
        await api.post(`/clients/${id}/${status}`);
        show(status === 'disable' ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.');
        openCreds({ id });
        load(meta.current_page);
    };

    const confirmDelete = async () => {
        await api.post(`/clients/${deleteTarget.id}/soft-delete`, { reason: deleteReason });
        show('Klien dipindah ke Recycle Bin.');
        setDeleteTarget(null);
        setDeleteReason('');
        setCreds(null);
        load(meta.current_page);
    };

    const load = (page = 1, q = debounced) => {
        setLoading(true);
        api.get('/clients', { params: { page, per_page: 15, search: q || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [debounced]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ name: item.name, email: item.email || '', phone: item.phone || '', company: item.company || '', occupation: item.occupation || '' });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/clients/${editing.id}`, form);
                show('Klien diperbarui.');
                load(meta.current_page);
                setOpen(false);
            } else {
                const { data } = await api.post('/clients', form);
                show('Klien ditambahkan.');
                load(meta.current_page);
                setOpen(false);
                setCreds(data.credentials);
            }
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <>
            <PageHeader
                title="Klien"
                subtitle="Kelola data klien untuk project dan pembayaran."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Tambah Klien
                    </button>
                }
            />

            <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                        <Icon name="search" size={16} />
                    </span>
                    <input
                        className="input pl-9"
                        placeholder="Cari nama, email, atau telepon..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            clearTimeout(window.__clientSearch);
                            window.__clientSearch = setTimeout(() => setDebounced(e.target.value), 400);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <Spinner />
            ) : items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Kontak</th>
                                <th>Status</th>
                                <th>Project</th>
                                <th>Bergabung</th>
                                <th className="w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                                <Icon name="user" size={16} />
                                            </div>
                                            <span className="font-medium text-ink">{item.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="text-sm text-ink">{item.email || '-'}</p>
                                        <p className="text-xs text-ink-muted">{item.phone || '-'}</p>
                                    </td>
                                    <td>
                                        <span className={`badge ${item.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : item.status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-zinc-500/15 text-ink-muted'}`}>
                                            {item.status === 'active' ? 'Aktif' : item.status === 'pending' ? 'Menunggu' : item.status === 'disabled' ? 'Nonaktif' : 'Tanpa akun'}
                                        </span>
                                    </td>
                                    <td><span className="badge">{item.projects_count ?? 0} project</span></td>
                                    <td className="text-sm text-ink-muted">{formatDate(item.created_at)}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button onClick={() => openCreds(item)} className="icon-btn" aria-label="Kredensial">
                                                <Icon name="lock" size={16} />
                                            </button>
                                            <button onClick={() => openEdit(item)} className="icon-btn" aria-label="Edit">
                                                <Icon name="edit" size={16} />
                                            </button>
                                            <button onClick={() => setDeleteTarget(item)} className="icon-btn hover:!text-red-500" aria-label="Hapus">
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                                Sebelumnya
                            </button>
                            <span className="text-sm text-ink-muted">Halaman {meta.current_page} dari {meta.last_page}</span>
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                                Berikutnya
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState title="Tidak ada klien" message={debounced ? 'Ubah kata kunci pencarian Anda.' : 'Tambahkan klien pertama Anda.'} />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Klien' : 'Tambah Klien'} wide footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                    <button type="submit" form="client-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            }>
                <form id="client-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Nama" required error={errors.name?.[0]}>
                        <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="Nama lengkap" />
                    </Field>
                    <Field label="Email" hint="wajib jika WhatsApp kosong" error={errors.email?.[0]}>
                        <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@contoh.com" />
                    </Field>
                    <Field label="Telepon / WhatsApp" hint="wajib jika email kosong" error={errors.phone?.[0]}>
                        <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
                    </Field>
                    <Field label="Perusahaan" hint="opsional" error={errors.company?.[0]}>
                        <input className="input" value={form.company} onChange={(e) => update('company', e.target.value)} />
                    </Field>
                    <Field label="Pekerjaan" hint="opsional" error={errors.occupation?.[0]}>
                        <input className="input" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} />
                    </Field>
                    <p className="text-xs text-ink-muted sm:col-span-2">Email atau WhatsApp (minimal satu) akan dipakai untuk login & menerima tautan aktivasi. Username dibuat otomatis dan bisa diubah di profil.</p>
                </form>
            </Modal>

            <Confirm
                open={!!deleteTarget}
                onClose={() => { setDeleteTarget(null); setDeleteReason(''); }}
                onConfirm={confirmDelete}
                title="Hapus Klien"
                message={
                    <div className="space-y-2">
                        <p className="text-sm text-ink-muted">Klien akan dipindah ke Recycle Bin (soft delete). Data historis tetap tersimpan.</p>
                        <input className="input" placeholder="Alasan (opsional)" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} autoFocus />
                    </div>
                }
            />

            <Modal open={!!creds} onClose={() => setCreds(null)} title="Kredensial & Akses Klien" wide>
                {credLoading ? (
                    <Spinner />
                ) : creds ? (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-surface-muted p-3">
                                <p className="text-xs text-ink-muted">Nama</p>
                                <p className="font-semibold text-ink">{creds.name}</p>
                            </div>
                            <div className="rounded-xl bg-surface-muted p-3">
                                <p className="text-xs text-ink-muted">Username</p>
                                <p className="truncate text-sm text-ink">@{creds.username}</p>
                            </div>
                            <div className="rounded-xl bg-surface-muted p-3">
                                <p className="text-xs text-ink-muted">Email</p>
                                <p className="truncate text-sm text-ink">{creds.email || '-'}</p>
                            </div>
                            <div className="rounded-xl bg-surface-muted p-3">
                                <p className="text-xs text-ink-muted">WhatsApp</p>
                                <p className="text-sm text-ink">{creds.phone || '-'}</p>
                            </div>
                            <div className="rounded-xl bg-surface-muted p-3">
                                <p className="text-xs text-ink-muted">Akun</p>
                                <p className="text-sm text-ink">
                                    {creds.has_password ? 'Kata sandi aktif' : 'Belum ada kata sandi'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="label">Kirim Tautan</label>
                            <p className="mb-3 text-xs text-ink-muted">
                                Undangan utk aktivasi akun baru · Recovery utk lupa password. Prioritas pengiriman WhatsApp → Email.
                            </p>
                            <div className="mb-3 sm:max-w-[200px]">
                                <select className="input" value={inviteHours} onChange={(e) => setInviteHours(e.target.value)}>
                                    <option value="">Durasi undangan (pakai global)</option>
                                    <option value="6">6 jam</option>
                                    <option value="12">12 jam</option>
                                    <option value="24">24 jam</option>
                                    <option value="48">48 jam</option>
                                    <option value="72">72 jam</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button className="btn-primary" disabled={issuing === 'invite'} onClick={() => issueToken('invite', true)}>
                                    <Icon name="send" size={16} /> {issuing === 'invite' ? 'Mengirim...' : 'Kirim Undangan'}
                                </button>
                                <button className="btn-outline" disabled={issuing === 'recovery'} onClick={() => issueToken('recovery', true)}>
                                    <Icon name="refresh" size={16} /> {issuing === 'recovery' ? 'Mengirim...' : 'Kirim Recovery'}
                                </button>
                                <button className="btn-outline" disabled={issuing === 'project'} onClick={() => issueToken('project', true)}>
                                    <Icon name="link" size={16} /> {issuing === 'project' ? 'Mengirim...' : 'Kirim Link Akses'}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-line pt-4">
                            <label className="label">Status Akun</label>
                            <div className="flex flex-wrap gap-2">
                                {creds.status !== 'active' && (
                                    <button className="btn-outline" onClick={() => toggleStatus(creds.id, 'activate')}>
                                        <Icon name="check" size={16} /> Aktifkan
                                    </button>
                                )}
                                {creds.status === 'active' && (
                                    <button className="btn-outline" onClick={() => toggleStatus(creds.id, 'disable')}>
                                        <Icon name="x" size={16} /> Nonaktifkan
                                    </button>
                                )}
                                <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => setDeleteTarget({ id: creds.id })}>
                                    <Icon name="trash" size={16} /> Hapus
                                </button>
                            </div>
                        </div>

                        {creds.tokens?.length > 0 && (
                            <div>
                                <label className="label">Tautan Terbaru</label>
                                <div className="space-y-2">
                                    {creds.tokens.map((t, i) => (
                                        <div key={t.token || i} className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs">
                                            <span className="badge">{t.purpose}</span>
                                            <code className="flex-1 truncate text-ink">{t.token}</code>
                                            <span className="text-ink-muted">{t.used_at ? 'dipakai' : formatDate(t.created_at)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <EmptyState title="Tidak ada data" />
                )}
            </Modal>

            {node}
        </>
    );
}
