import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Spinner, EmptyState, Modal, Field, useToast, formatRupiah, formatDate } from '../components/ui';

export const statusOptions = [
    { value: 'pending', label: 'Menunggu', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    { value: 'in_progress', label: 'Berjalan', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
    { value: 'completed', label: 'Selesai', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    { value: 'delivered', label: 'Terkirim', color: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
];

export function statusLabel(value) {
    return statusOptions.find((s) => s.value === value)?.label || value;
}

export function StatusBadge({ value }) {
    const item = statusOptions.find((s) => s.value === value);
    return <span className={`badge ${item?.color || ''}`}>{item?.label || value}</span>;
}

const emptyForm = {
    client_id: '',
    client_mode: 'existing',
    client_name: '',
    client_phone: '',
    client_email: '',
    client_notes: '',
    name: '',
    type: '',
    package_id: '',
    event_date: '',
    description: '',
    price: '',
    status: 'pending',
    start_date: '',
    end_date: '',
};

export default function Projects() {
    const { user, can } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [status, setStatus] = useState('');
    const [clients, setClients] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [createdCreds, setCreatedCreds] = useState(null);
    const { show, node } = useToast();

    const load = (page = 1) => {
        setLoading(true);
        api.get('/projects', { params: { page, per_page: 15, status: status || undefined } })
            .then(({ data }) => {
                setItems(Array.isArray(data) ? data : data.data);
                setMeta(Array.isArray(data) ? { last_page: 1, current_page: 1 } : data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [status]);

    useEffect(() => {
        if (isAdmin) api.get('/clients', { params: { per_page: 100 } }).then(({ data }) => setClients(data.data));
        if (isAdmin) api.get('/packages', { params: { active_only: 1 } }).then(({ data }) => setPackages(data));
    }, [isAdmin]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setCreatedCreds(null);
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            client_id: item.client_id || '',
            client_mode: 'existing',
            client_name: '',
            client_phone: '',
            client_email: '',
            client_notes: '',
            name: item.name,
            type: item.type || '',
            package_id: item.package_id || '',
            event_date: item.event_date?.split('T')[0] || '',
            description: item.description || '',
            price: item.price || '',
            status: item.status,
            start_date: item.start_date?.split('T')[0] || '',
            end_date: item.end_date?.split('T')[0] || '',
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
                await api.put(`/projects/${editing.id}`, form);
                show('Project diperbarui.');
                load(meta.current_page);
                setOpen(false);
            } else {
                const payload = { ...form };
                if (payload.client_mode === 'existing') {
                    payload.client_name = '';
                    payload.client_phone = '';
                    payload.client_email = '';
                    payload.client_notes = '';
                } else {
                    payload.client_id = '';
                }
                const { data } = await api.post('/projects', payload);
                show('Project dibuat.');
                setCreatedCreds(data.credentials);
                load(meta.current_page);
                setOpen(false);
            }
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const copyCreds = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            show('Kredensial disalin.');
        } catch {
            show('Gagal menyalin.', 'error');
        }
    };

    return (
        <>
            <PageHeader
                title={isAdmin ? 'Proyek' : 'Proyek Saya'}
                subtitle={isAdmin ? 'Kelola project, file, dan status klien.' : 'Pantau progress dan file project Anda.'}
                action={
                    isAdmin ? (
                        <button className="btn-primary" onClick={openCreate}>
                            <Icon name="plus" size={18} /> Buat Project
                        </button>
                    ) : undefined
                }
            />

            {isAdmin && (
                <div className="mb-4 flex flex-wrap gap-2">
                    <button className={`chip ${!status ? 'chip-active' : ''}`} onClick={() => setStatus('')}>
                        Semua
                    </button>
                    {statusOptions.map((s) => (
                        <button key={s.value} className={`chip ${status === s.value ? 'chip-active' : ''}`} onClick={() => setStatus(s.value)}>
                            {s.label}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <Spinner />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <Link key={item.id} to={`/dashboard/projects/${item.id}`} className="card group p-5">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                    {item.name}
                                </h3>
                                <StatusBadge value={item.status} />
                            </div>
                            {item.description && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{item.description}</p>}
                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                                {isAdmin && (
                                    <span className="flex items-center gap-1.5">
                                        <Icon name="user" size={14} /> {item.client?.name || '-'}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Icon name="calendar" size={14} />
                                    {item.start_date ? formatDate(item.start_date) : 'Segera'}
                                </span>
                                {item.price !== null && item.price !== undefined && (
                                <span className="font-semibold text-ink">{formatRupiah(item.price)}</span>
                            )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyState title={isAdmin ? 'Belum ada project' : 'Anda belum memiliki project'} />
            )}

            {meta.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                        Sebelumnya
                    </button>
                    <span className="text-sm text-ink-muted">Halaman {meta.current_page} dari {meta.last_page}</span>
                    <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                        Berikutnya
                    </button>
                </div>
            )}

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit Project' : 'Buat Project'}
                wide
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                        <button type="submit" form="project-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                }
            >
                <form id="project-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isAdmin && !editing && (
                        <>
                            <div className="sm:col-span-2">
                                <Field label="Klien" required>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'existing', label: 'Pilih klien' },
                                            { value: 'new', label: 'Klien baru' },
                                        ].map((m) => (
                                            <button
                                                key={m.value}
                                                type="button"
                                                onClick={() => setForm({ ...form, client_mode: m.value })}
                                                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                                    form.client_mode === m.value
                                                        ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-400'
                                                        : 'border-line text-ink-muted hover:bg-surface-muted'
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                            </div>

                            {form.client_mode === 'existing' ? (
                                <Field label="Pilih Klien" required error={errors.client_id?.[0]}>
                                    <select className="input" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
                                        <option value="">Pilih klien...</option>
                                        {clients.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </Field>
                            ) : (
                                <>
                                    <Field label="Nama Klien" required error={errors.client_name?.[0]}>
                                        <input className="input" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
                                    </Field>
                                    <Field label="No. WhatsApp" required error={errors.client_phone?.[0]}>
                                        <input className="input" placeholder="08xxxxxxxxxx" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} required />
                                    </Field>
                                    <Field label="Email" hint="opsional" error={errors.client_email?.[0]}>
                                        <input className="input" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                                    </Field>
                                    <Field label="Catatan" hint="opsional" error={errors.client_notes?.[0]}>
                                        <input className="input" value={form.client_notes} onChange={(e) => setForm({ ...form, client_notes: e.target.value })} />
                                    </Field>
                                </>
                            )}
                        </>
                    )}
                    {isAdmin && editing && (
                        <Field label="Klien" required error={errors.client_id?.[0]}>
                            <select className="input" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
                                <option value="">Pilih klien...</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </Field>
                    )}
                    <Field label="Nama Project" required error={errors.name?.[0]}>
                        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field label="Jenis" hint="opsional" error={errors.type?.[0]}>
                        <input className="input" placeholder="Wedding, Prewedding, Event..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                    </Field>
                    {isAdmin && packages.length > 0 && (
                        <div className="sm:col-span-2">
                            <Field label="Paket" hint="pilih paket untuk mengisi harga otomatis">
                                <select
                                    className="input"
                                    value={form.package_id}
                                    onChange={(e) => {
                                        const pid = e.target.value;
                                        const pkg = packages.find((p) => String(p.id) === pid);
                                        setForm({
                                            ...form,
                                            package_id: pid,
                                            name: form.name || (pkg ? pkg.name : ''),
                                            type: form.type || (pkg ? pkg.type : ''),
                                            price: pkg ? pkg.price : form.price,
                                        });
                                    }}
                                >
                                    <option value="">Tanpa paket (harga manual)</option>
                                    {packages.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} — {formatRupiah(p.price)}</option>
                                    ))}
                                </select>
                            </Field>
                            {(() => {
                                const pkg = packages.find((p) => String(p.id) === form.package_id);
                                if (!pkg) return null;
                                return (
                                    <div className="mt-2 rounded-xl border border-line bg-surface-muted/50 p-3 text-sm">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Isi Paket</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(pkg.items || []).map((it, i) => (
                                                <span key={i} className="rounded-lg bg-surface px-2 py-1 text-xs text-ink">
                                                    {it.name} {it.qty > 1 ? `x${it.qty}` : ''} · {formatRupiah(it.line_total)}
                                                </span>
                                            ))}
                                        </div>
                                        {pkg.discount > 0 && (
                                            <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Hemat {formatRupiah(pkg.discount)}</p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                    <Field label="Tanggal Acara" hint="opsional" error={errors.event_date?.[0]}>
                        <input className="input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field label="Deskripsi" hint="opsional" error={errors.description?.[0]}>
                            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </Field>
                    </div>
                    <Field label="Harga (Rp)" hint="opsional" error={errors.price?.[0]}>
                        <input className="input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    </Field>
                    <Field label="Status" required error={errors.status?.[0]}>
                        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            {statusOptions.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Tanggal Mulai" hint="opsional">
                        <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                    </Field>
                    <Field label="Tanggal Selesai" hint="opsional">
                        <input className="input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                    </Field>
                </form>
            </Modal>

            <Modal
                open={!!createdCreds}
                onClose={() => setCreatedCreds(null)}
                title="Kredensial Klien"
                footer={
                    createdCreds && (
                        <div className="flex flex-col gap-2">
                            <button
                                className="btn-primary w-full"
                                onClick={() =>
                                    copyCreds(
                                        `Login: ${createdCreds.login_url}\nEmail: ${createdCreds.email}\nKata sandi: ${createdCreds.password}\nAkses tanpa login: ${createdCreds.access_url}`
                                    )
                                }
                            >
                                <Icon name="check" size={16} /> Salin Semua
                            </button>
                        </div>
                    )
                }
            >
                {createdCreds && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400">
                            Salin dan bagikan kredensial ini ke klien. Kata sandi hanya ditampilkan sekali ini.
                        </div>
                        <div className="space-y-2 rounded-xl bg-surface-muted p-4 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-ink-muted">Tautan Login</span>
                                <button className="icon-btn" onClick={() => copyCreds(createdCreds.login_url)} aria-label="Salin">
                                    <Icon name="link" size={14} />
                                </button>
                            </div>
                            <code className="block truncate text-xs text-ink">{createdCreds.login_url}</code>
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-ink-muted">Email</span>
                                <button className="icon-btn" onClick={() => copyCreds(createdCreds.email)} aria-label="Salin">
                                    <Icon name="link" size={14} />
                                </button>
                            </div>
                            <code className="block truncate text-xs text-ink">{createdCreds.email}</code>
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-ink-muted">Kata Sandi</span>
                                <button className="icon-btn" onClick={() => copyCreds(createdCreds.password)} aria-label="Salin">
                                    <Icon name="link" size={14} />
                                </button>
                            </div>
                            <code className="block truncate text-xs font-mono text-ink">{createdCreds.password}</code>
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-ink-muted">Tautan Akses (tanpa login)</span>
                                <button className="icon-btn" onClick={() => copyCreds(createdCreds.access_url)} aria-label="Salin">
                                    <Icon name="link" size={14} />
                                </button>
                            </div>
                            <code className="block truncate text-xs text-ink">{createdCreds.access_url}</code>
                        </div>
                    </div>
                )}
            </Modal>

            {node}
        </>
    );
}
