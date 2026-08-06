import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import MediaPicker from '../components/MediaPicker';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast } from '../components/ui';

const EMPTY_ADMIN = { name: '', email: '', phone: '', company: '', occupation: '' };
const EMPTY_MEMBER = { name: '', position: '', bio: '', photo_url: '', social_facebook: '', social_instagram: '', social_tiktok: '', social_whatsapp: '', order: 0 };

const SOCIAL_FIELDS = [
    { key: 'social_facebook', label: 'Facebook', icon: 'facebook' },
    { key: 'social_instagram', label: 'Instagram', icon: 'instagram' },
    { key: 'social_tiktok', label: 'TikTok', icon: 'tiktok' },
    { key: 'social_whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
];

function AdminTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_ADMIN);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [credLoading, setCredLoading] = useState(false);
    const [issuing, setIssuing] = useState(null);
    const [inviteHours, setInviteHours] = useState('');
    const [deleting, setDeleting] = useState(null);
    const { show, node } = useToast();

    const load = () => {
        api.get('/team')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const openCreds = async (item) => {
        setCredLoading(true);
        try {
            const { data } = await api.get(`/team/${item.id}/credentials`);
            setCredentials(data);
        } catch {
            show('Gagal memuat kredensial.', 'error');
        } finally {
            setCredLoading(false);
        }
    };

    const issueToken = async (purpose, send = true) => {
        if (!credentials) return;
        setIssuing(purpose);
        try {
            await api.post(`/team/${credentials.id}/token/${purpose}`, { send, expires_hours: inviteHours || undefined });
            show(purpose === 'invite' ? 'Undangan dibuat & dikirim.' : 'Tautan dibuat' + (send ? ' & dikirim.' : '.'));
            openCreds({ id: credentials.id });
        } catch {
            show('Gagal membuat tautan.', 'error');
        } finally {
            setIssuing(null);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_ADMIN);
        setErrors({});
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.name,
            email: item.email || '',
            phone: item.phone || '',
            company: item.company || '',
            occupation: item.occupation || '',
        });
        setErrors({});
        setOpen(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/team/${editing.id}`, form);
                setCredentials(null);
                show('Admin diperbarui.');
                setOpen(false);
                setForm(EMPTY_ADMIN);
                load();
            } else {
                const { data } = await api.post('/team', form);
                setCredentials({ ...data.credentials, invite_url: data.invite?.url });
                setOpen(false);
                setForm(EMPTY_ADMIN);
                load();
            }
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else show('Gagal menyimpan admin.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await api.delete(`/team/${deleting.id}`);
        show('Admin dihapus.');
        setDeleting(null);
        load();
    };

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            show('Disalin.');
        } catch {
            show('Gagal menyalin.', 'error');
        }
    };

    if (loading) return <Spinner />;

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

            {items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/20 text-lg font-bold text-brand-600 dark:text-brand-400">
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
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
                                        title="Kredensial & tautan akses"
                                        onClick={() => openCreds(item)}
                                    >
                                        <Icon name="lock" size={16} />
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
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                        <button type="submit" form="admin-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : editing ? 'Simpan' : 'Buat Admin'}</button>
                    </div>
                }
            >
                <form id="admin-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Nama" required error={errors.name?.[0]}>
                        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nama lengkap" />
                    </Field>
                    <Field label="Email" hint="wajib jika WhatsApp kosong" error={errors.email?.[0]}>
                        <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field label="Nomor Ponsel / WhatsApp" hint="wajib jika email kosong" error={errors.phone?.[0]}>
                        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xx" />
                    </Field>
                    <Field label="Perusahaan" hint="opsional" error={errors.company?.[0]}>
                        <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </Field>
                    <Field label="Pekerjaan" hint="opsional" error={errors.occupation?.[0]}>
                        <input className="input" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                    </Field>
                    <p className="text-xs text-ink-muted sm:col-span-2">Email atau WhatsApp (minimal satu) akan dipakai untuk login & menerima tautan aktivasi. Username dibuat otomatis dan bisa diubah di profil.</p>
                </form>
            </Modal>

            <Modal
                open={!!credentials}
                onClose={() => setCredentials(null)}
                title="Kredensial Admin"
                footer={
                    credentials && (
                        <div className="flex flex-col gap-2">
                            <button className="btn-primary w-full" onClick={() => setCredentials(null)}>Selesai</button>
                        </div>
                    )
                }
            >
                {credLoading ? (
                    <Spinner />
                ) : credentials ? (
                    <div className="space-y-4">
                        <p className="text-sm text-ink-muted">
                            Akun <strong className="text-ink">{credentials.name}</strong> ({credentials.status === 'active' ? 'aktif' : credentials.status === 'pending' ? 'menunggu aktivasi' : 'nonaktif'}). Salin kredensial berikut untuk dikirim ke admin.
                        </p>
                        <div className="space-y-2 rounded-xl bg-surface-muted p-4 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-ink-muted">Login:</span>
                                <button className="flex items-center gap-1 font-semibold text-ink hover:text-brand-600" onClick={() => copy('/login')}>
                                    /login <Icon name="link" size={14} />
                                </button>
                            </div>
                            {credentials.username && (
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-ink-muted">Username:</span>
                                    <button className="flex items-center gap-1 font-semibold text-ink hover:text-brand-600" onClick={() => copy(credentials.username)}>
                                        {credentials.username} <Icon name="copy" size={14} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-ink-muted">Email:</span>
                                <button className="flex items-center gap-1 font-semibold text-ink hover:text-brand-600" onClick={() => copy(credentials.email || credentials.phone)}>
                                    {credentials.email || credentials.phone} <Icon name="copy" size={14} />
                                </button>
                            </div>
                            {credentials.invite_url && (
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-ink-muted">Link aktivasi:</span>
                                    <button className="flex items-center gap-1 font-semibold text-ink hover:text-brand-600" onClick={() => copy(credentials.invite_url)}>
                                        <span className="truncate max-w-[220px]">buka & set kata sandi</span> <Icon name="link" size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label">Kirim Tautan</label>
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
                            </div>
                        </div>

                        {credentials.tokens?.length > 0 && (
                            <div>
                                <label className="label">Tautan Terbaru</label>
                                <div className="space-y-2">
                                    {credentials.tokens.map((t, i) => (
                                        <div key={t.token || i} className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs">
                                            <span className="badge">{t.purpose}</span>
                                            <code className="flex-1 truncate text-ink">{t.token}</code>
                                            <span className="text-ink-muted">{t.used_at ? 'dipakai' : t.created_at}</span>
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

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus admin?" message="Admin ini tidak akan bisa login lagi." />
            {node}
        </>
    );
}

function TeamTab() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_MEMBER);
    const [preview, setPreview] = useState('');
    const [mediaOpen, setMediaOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { show, node } = useToast();

    const load = () => {
        api.get('/team-members')
            .then(({ data }) => setMembers(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_MEMBER);
        setPreview('');
        setOpen(true);
    };

    const openEdit = (m) => {
        setEditing(m);
        setForm({
            name: m.name,
            position: m.position || '',
            bio: m.bio || '',
            photo_url: m.photo_url || '',
            social_facebook: m.social_facebook || '',
            social_instagram: m.social_instagram || '',
            social_tiktok: m.social_tiktok || '',
            social_whatsapp: m.social_whatsapp || '',
            order: m.order || 0,
        });
        setPreview(m.photo_display_url);
        setOpen(true);
    };

    const onMediaSelect = (sel) => {
        const val = sel.source === 'url' ? sel.url : `media:${sel.mediaId}`;
        setForm({ ...form, photo_url: val });
        setPreview(sel.url);
        setMediaOpen(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/team-members/${editing.id}`, form);
                show('Anggota tim diperbarui.');
            } else {
                await api.post('/team-members', form);
                show('Anggota tim ditambahkan.');
            }
            setOpen(false);
            load();
        } catch (err) {
            show('Gagal menyimpan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const importUsers = async () => {
        const { data } = await api.post('/team-members/import');
        show(data.created ? `${data.created} anggota diambil dari profil.` : 'Semua profil sudah ada di tim.');
        setMembers(data.members);
    };

    const handleDelete = async () => {
        await api.delete(`/team-members/${deleting.id}`);
        show('Anggota tim dihapus.');
        setDeleting(null);
        load();
    };

    const SocialLink = ({ href, icon, label }) =>
        href ? (
            <a href={href} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-muted transition-colors hover:bg-brand-500/15 hover:text-brand-600" title={label} aria-label={label}>
                <Icon name={icon} size={15} />
            </a>
        ) : null;

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader
                title="Tim"
                subtitle="Tampilkan di halaman Tentang. Bisa diambil otomatis dari profil lalu disesuaikan."
                action={
                    <div className="flex gap-2">
                        <button className="btn-outline" onClick={importUsers}>
                            <Icon name="refresh" size={16} /> Ambil dari Profil
                        </button>
                        <button className="btn-primary" onClick={openCreate}>
                            <Icon name="plus" size={18} /> Tambah Anggota
                        </button>
                    </div>
                }
            />

            {members.length ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((m) => (
                        <div key={m.id} className="card overflow-hidden">
                            <div className="relative aspect-square overflow-hidden">
                                <img src={m.photo_display_url} alt={m.name} className="h-full w-full object-cover" />
                                {m.is_owner && (
                                    <span className="badge absolute left-3 top-3 bg-amber-400 text-amber-950 shadow">
                                        <Icon name="star" size={12} /> Owner
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="font-bold text-ink">{m.name}</p>
                                <p className="text-xs text-brand-600 dark:text-brand-400">{m.position || 'Tim'}</p>
                                {m.bio && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{m.bio}</p>}
                                <div className="mt-3 flex items-center gap-1.5">
                                    <SocialLink href={m.social_facebook} icon="facebook" label="Facebook" />
                                    <SocialLink href={m.social_instagram} icon="instagram" label="Instagram" />
                                    <SocialLink href={m.social_tiktok} icon="tiktok" label="TikTok" />
                                    <SocialLink href={m.social_whatsapp} icon="whatsapp" label="WhatsApp" />
                                    <div className="ml-auto flex gap-1">
                                        <button onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" title="Edit">
                                            <Icon name="edit" size={15} />
                                        </button>
                                        <button onClick={() => setDeleting(m)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" title="Hapus">
                                            <Icon name="trash" size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon="users" title="Belum ada anggota tim" message="Ambil dari profil pengguna atau tambah manual." />
            )}

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'}
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                        <button type="submit" form="member-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
                    </div>
                }
            >
                <form id="member-form" onSubmit={submit} className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <div className="h-24 w-24 overflow-hidden rounded-2xl border border-line bg-surface-muted">
                                {preview ? (
                                    <img src={preview} alt="Foto" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-ink-muted">
                                        <Icon name="user" size={28} />
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={() => setMediaOpen(true)} className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg">
                                <Icon name="image" size={14} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-3">
                            <Field label="Nama" required>
                                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </Field>
                            <Field label="Jabatan">
                                <input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Owner & Founder" />
                            </Field>
                        </div>
                    </div>
                    <Field label="Bio">
                        <textarea className="input min-h-[80px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Facebook URL">
                            <input className="input" value={form.social_facebook} onChange={(e) => setForm({ ...form, social_facebook: e.target.value })} />
                        </Field>
                        <Field label="Instagram URL">
                            <input className="input" value={form.social_instagram} onChange={(e) => setForm({ ...form, social_instagram: e.target.value })} />
                        </Field>
                        <Field label="TikTok URL">
                            <input className="input" value={form.social_tiktok} onChange={(e) => setForm({ ...form, social_tiktok: e.target.value })} />
                        </Field>
                        <Field label="WhatsApp URL">
                            <input className="input" value={form.social_whatsapp} onChange={(e) => setForm({ ...form, social_whatsapp: e.target.value })} />
                        </Field>
                    </div>
                </form>
            </Modal>

            <MediaPicker open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={onMediaSelect} title="Pilih Foto Anggota" />
            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus anggota tim?" />
            {node}
        </>
    );
}

export default function Team() {
    const [tab, setTab] = useState('admin');
    return (
        <div>
            <div className="mb-6 flex gap-1 rounded-xl bg-surface-muted p-1">
                {[
                    { key: 'admin', label: 'Admin' },
                    { key: 'tim', label: 'Tim' },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-surface text-ink shadow' : 'text-ink-muted hover:text-ink'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            {tab === 'admin' ? <AdminTab /> : <TeamTab />}
        </div>
    );
}
