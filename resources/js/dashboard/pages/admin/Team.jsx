import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import MediaPicker from '../../components/MediaPicker';
import UserDetailModal from '../../components/UserDetailModal';
import PresenceBadge from '../../components/PresenceBadge';
import { PageHeader, EmptyState, Modal, Confirm, Field } from '../../components/ui';
import Skeleton, { AvatarCardGridSkeleton } from '../../components/Skeleton';

const EMPTY_ADMIN = { name: '', username: '', email: '', phone: '', company: '', occupation: '', bio: '', status: 'pending', avatar: undefined };

function AdminTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_ADMIN);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [detail, setDetail] = useState(null);
    const [credLoading, setCredLoading] = useState(false);
    const [issuing, setIssuing] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [mediaOpen, setMediaOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        api.get('/team')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const openDetail = async (item) => {
        setCredLoading(true);
        try {
            const { data } = await api.get(`/team/${item.id}/credentials`);
            setDetail(data);
        } catch {
            toast.error('Gagal memuat detail.');
        } finally {
            setCredLoading(false);
        }
    };

    const issueToken = async (purpose, send = true) => {
        if (!detail) return;
        setIssuing(purpose);
        try {
            const { data } = await api.post(`/team/${detail.id}/token/${purpose}`, { send });
            toast.success(purpose === 'invite' ? 'Undangan dibuat & dikirim.' : 'Tautan dibuat' + (send ? ' & dikirim.' : '.'));
            openDetail({ id: detail.id });
            return data;
        } catch {
            toast.error('Gagal membuat tautan.');
        } finally {
            setIssuing(null);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_ADMIN);
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
        setAvatarUrl(sel.thumbnail_url || sel.url);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/team/${editing.id}`, form);
                setDetail(null);
                toast.success('Admin diperbarui.');
                setOpen(false);
                setForm(EMPTY_ADMIN);
                load();
            } else {
                const { data } = await api.post('/team', form);
                setDetail(data.credentials);
                setOpen(false);
                setForm(EMPTY_ADMIN);
                load();
            }
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error(getApiErrorMessage(err, 'Gagal menyimpan admin.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/team/${deleting.id}`);
            toast.success('Admin dihapus.');
            setDeleting(null);
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus admin.'));
        }
    };

    return (
        <>
            <PageHeader
                title="Kelola Admin"
                subtitle="Undang atau kelola akun admin. Owner tidak bisa diubah/dihapus."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Undang Admin
                    </button>
                }
            />

            {loading ? (
                <AvatarCardGridSkeleton count={6} />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar src={item.avatar} name={item.name} size="lg" shape="full" />
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-ink">{item.name}</p>
                                        <p className="truncate text-xs text-ink-muted">{item.email || item.phone || 'Tanpa kontak'}</p>
                                        {item.username && <p className="truncate text-xs text-ink-muted">@{item.username}</p>}
                                        {item.company && <p className="truncate text-xs text-ink-muted">{item.company}</p>}
                                    </div>
                                </div>
                                <span className={`badge ${item.role === 'owner' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'}`}>
                                    {item.role === 'owner' ? 'Owner' : 'Admin'}
                                </span>
                            </div>
                            <div className="mt-3">
                                <PresenceBadge online={item.online} lastSeenAt={item.last_seen_at} />
                            </div>
                            {item.role !== 'owner' && (
                                <div className="mt-4 flex gap-1">
                                    <button
                                        className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600"
                                        title="Edit"
                                        onClick={() => openEdit(item)}
                                    >
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button
                                        className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600"
                                        title="Lihat detail"
                                        onClick={() => openDetail(item)}
                                    >
                                        <Icon name="eye" size={16} />
                                    </button>
                                    <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" title="Hapus" onClick={() => setDeleting(item)}>
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon="users" title="Belum ada admin" />
            )}

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit Admin' : 'Undang Admin'}
                wide
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                        <button type="submit" form="admin-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : editing ? 'Simpan' : 'Buat Admin'}</button>
                    </div>
                }
            >
                <form id="admin-form" onSubmit={submit} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500/15 ring-2 ring-line">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
                            ) : (
                                <Icon name="user" size={24} className="text-brand-600 dark:text-brand-400" />
                            )}
                        </div>
                        <div>
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
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Nama" required error={errors.name?.[0]}>
                            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nama lengkap" />
                        </Field>
                        <Field label="Username" hint="identitas login" error={errors.username?.[0]}>
                            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="contoh: budi_santoso" />
                        </Field>
                        <Field label="Email" hint="wajib jika WhatsApp kosong" error={errors.email?.[0]}>
                            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </Field>
                        <Field label="Nomor Ponsel / WhatsApp" hint="wajib jika email kosong" error={errors.phone?.[0]}>
                            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xx" />
                        </Field>
                        <Field label="Perusahaan" error={errors.company?.[0]}>
                            <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                        </Field>
                        <Field label="Pekerjaan" error={errors.occupation?.[0]}>
                            <input className="input" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                        </Field>
                        <Field label="Status Akun" error={errors.status?.[0]}>
                            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Aktif</option>
                                <option value="pending">Menunggu Aktivasi</option>
                                <option value="disabled">Nonaktif</option>
                            </select>
                        </Field>
                        <Field label="Bio" error={errors.bio?.[0]}>
                            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Cerita singkat (opsional)" />
                        </Field>
                    </div>
                    <p className="text-xs text-ink-muted">Email atau WhatsApp (minimal satu) dipakai untuk login & menerima tautan aktivasi.</p>
                </form>
            </Modal>

            <MediaPicker open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={onMediaPick} title="Pilih Foto Profil" />

            <UserDetailModal
                open={!!detail}
                onClose={() => setDetail(null)}
                data={detail}
                loading={credLoading}
                onIssueToken={issueToken}
                issuing={issuing}
                showProjects={false}
            />

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus admin?" message="Admin ini tidak akan bisa login lagi." />
        </>
    );
}


export default function Team() {
    return <AdminTab />;
}
