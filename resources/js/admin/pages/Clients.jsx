import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import MediaPicker from '../components/MediaPicker';
import UserDetailModal from '../components/UserDetailModal';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast, formatDate } from '../components/ui';

const emptyForm = { name: '', username: '', email: '', phone: '', company: '', occupation: '', bio: '', status: 'pending', avatar: undefined };

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
    const [detail, setDetail] = useState(null);
    const [credLoading, setCredLoading] = useState(false);
    const [issuing, setIssuing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [mediaOpen, setMediaOpen] = useState(false);
    const { show, node } = useToast();

    const openDetail = async (item) => {
        setCredLoading(true);
        try {
            const { data } = await api.get(`/clients/${item.id}/credentials`);
            setDetail(data);
        } catch {
            show('Gagal memuat detail.', 'error');
        } finally {
            setCredLoading(false);
        }
    };

    const issueToken = async (purpose, send = true) => {
        if (!detail) return;
        setIssuing(purpose);
        try {
            const { data } = await api.post(`/clients/${detail.id}/token/${purpose}`, { send });
            show(purpose === 'invite' ? 'Undangan dibuat & dikirim.' : 'Tautan dibuat' + (send ? ' & dikirim.' : '.'));
            openDetail({ id: detail.id });
            return data;
        } catch {
            show('Gagal membuat tautan.', 'error');
        } finally {
            setIssuing(null);
        }
    };

    const confirmDelete = async () => {
        await api.post(`/clients/${deleteTarget.id}/soft-delete`, { reason: deleteReason });
        show('Klien dipindah ke Recycle Bin.');
        setDeleteTarget(null);
        setDeleteReason('');
        setDetail(null);
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
        setAvatarUrl(null);
        setErrors({});
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.name,
            username: item.username || '',
            email: item.email || '',
            phone: item.phone || '',
            company: item.company || '',
            occupation: item.occupation || '',
            bio: item.bio || '',
            status: item.status || 'pending',
            avatar: undefined,
        });
        setAvatarUrl(item.avatar || null);
        setErrors({});
        setOpen(true);
    };

    const onMediaPick = (sel) => {
        const raw = sel.source === 'url' ? sel.url.trim() : `media:${sel.mediaId}`;
        setForm((f) => ({ ...f, avatar: raw }));
        setAvatarUrl(sel.url);
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
                setDetail(data.credentials);
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
                                            <button onClick={() => openDetail(item)} className="icon-btn" aria-label="Lihat detail">
                                                <Icon name="eye" size={16} />
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
                <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
                    {editing && (
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500/15 ring-2 ring-line">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
                                ) : (
                                    <Icon name="user" size={24} className="text-brand-600 dark:text-brand-400" />
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button type="button" className="btn-outline" onClick={() => setMediaOpen(true)}>
                                    <Icon name="edit" size={16} />
                                    <span className="hidden sm:inline">Pilih Foto</span>
                                </button>
                                {avatarUrl && (
                                    <button type="button" className="btn-outline text-red-600 hover:!bg-red-500/10 hover:!border-red-500/40" onClick={() => { setForm((f) => ({ ...f, avatar: null })); setAvatarUrl(null); }}>
                                        <Icon name="trash" size={16} />
                                        <span className="hidden sm:inline">Hapus Foto</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Nama" required error={errors.name?.[0]}>
                            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="Nama lengkap" />
                        </Field>
                        {editing && (
                            <Field label="Username" hint="identitas login" error={errors.username?.[0]}>
                                <input className="input" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="contoh: budi_santoso" />
                            </Field>
                        )}
                        <Field label="Email" hint="wajib jika WhatsApp kosong" error={errors.email?.[0]}>
                            <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@contoh.com" />
                        </Field>
                        <Field label="Telepon / WhatsApp" hint="wajib jika email kosong" error={errors.phone?.[0]}>
                            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
                        </Field>
                        <Field label="Perusahaan" error={errors.company?.[0]}>
                            <input className="input" value={form.company} onChange={(e) => update('company', e.target.value)} />
                        </Field>
                        <Field label="Pekerjaan" error={errors.occupation?.[0]}>
                            <input className="input" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} />
                        </Field>
                        {editing && (
                            <Field label="Status Akun" error={errors.status?.[0]}>
                                <select className="input" value={form.status} onChange={(e) => update('status', e.target.value)}>
                                    <option value="active">Aktif</option>
                                    <option value="pending">Menunggu Aktivasi</option>
                                    <option value="disabled">Nonaktif</option>
                                </select>
                            </Field>
                        )}
                        {editing && (
                            <Field label="Bio" error={errors.bio?.[0]}>
                                <textarea className="input" rows={3} value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Cerita singkat klien (opsional)" />
                            </Field>
                        )}
                    </div>
                    <p className="text-xs text-ink-muted">Email atau WhatsApp (minimal satu) dipakai untuk login & menerima tautan aktivasi.</p>
                </form>
            </Modal>

            <MediaPicker open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={onMediaPick} title="Pilih Foto Profil" />

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

            <UserDetailModal
                open={!!detail}
                onClose={() => setDetail(null)}
                data={detail}
                loading={credLoading}
                onIssueToken={issueToken}
                issuing={issuing}
            />

            {node}
        </>
    );
}
