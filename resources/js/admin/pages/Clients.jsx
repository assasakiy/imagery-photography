import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast, formatDate } from '../components/ui';

const emptyForm = { name: '', email: '', phone: '', company: '', notes: '', allowed_methods: null };
const LOGIN_OPTIONS = ['password', 'otp', 'google', 'token'];

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
    const [deleting, setDeleting] = useState(null);
    const { show, node } = useToast();

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
        setForm({
            name: item.name,
            email: item.email || '',
            phone: item.phone || '',
            company: item.company || '',
            notes: item.notes || '',
            allowed_methods: item.user?.allowed_methods?.length ? item.user.allowed_methods : null,
        });
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
            } else {
                await api.post('/clients', form);
                show('Klien ditambahkan.');
            }
            load(meta.current_page);
            setOpen(false);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await api.delete(`/clients/${deleting.id}`);
        show('Klien dihapus.');
        setDeleting(null);
        load(meta.current_page);
    };

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
                                <th>Perusahaan</th>
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
                                    <td className="text-sm text-ink-muted">{item.company || '-'}</td>
                                    <td><span className="badge">{item.projects?.length ?? 0} project</span></td>
                                    <td className="text-sm text-ink-muted">{formatDate(item.created_at)}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(item)} className="icon-btn" aria-label="Edit">
                                                <Icon name="edit" size={16} />
                                            </button>
                                            <button onClick={() => setDeleting(item)} className="icon-btn hover:!text-red-500" aria-label="Hapus">
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
                        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field label="Email" hint="opsional" error={errors.email?.[0]}>
                        <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field label="Telepon / WhatsApp" hint="opsional" error={errors.phone?.[0]}>
                        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </Field>
                    <Field label="Perusahaan" hint="opsional" error={errors.company?.[0]}>
                        <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </Field>
                    <Field label="Catatan" hint="opsional" error={errors.notes?.[0]}>
                        <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </Field>
                    {editing && (
                        <div className="sm:col-span-2 rounded-xl border border-line bg-surface-muted/40 p-4">
                            <label className="label">Override Metode Login</label>
                            <p className="mb-3 text-xs text-ink-muted">
                                Kosongkan untuk memakai pengaturan global. Centang metode yang diizinkan utk akun ini.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {LOGIN_OPTIONS.map((m) => {
                                    const enabled = form.allowed_methods?.includes(m);
                                    return (
                                        <label key={m} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                                            <input
                                                type="checkbox"
                                                checked={!!enabled}
                                                onChange={(e) => {
                                                    const next = form.allowed_methods ? [...form.allowed_methods] : [];
                                                    if (e.target.checked) next.push(m);
                                                    else next.splice(next.indexOf(m), 1);
                                                    setForm({ ...form, allowed_methods: next.length ? next : null });
                                                }}
                                                className="h-4 w-4 rounded border-line text-brand-600"
                                            />
                                            <span className="capitalize">{m}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} message="Project terkait klien ini tidak ikut terhapus." />
            {node}
        </>
    );
}
