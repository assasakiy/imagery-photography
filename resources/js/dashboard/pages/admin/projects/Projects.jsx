import { copyToClipboard } from '../../../lib/clipboard';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { useAuth } from '../../../context/AuthContext';
import { PageHeader, EmptyState, Modal, Field, formatRupiah, formatDate, formatTimeInput } from '../../../components/ui';
import Skeleton, { CardGridSkeleton } from '../../../components/Skeleton';
import { toast } from '../../../lib/toast';

export const statusOptions = [
    { value: 'scheduled', label: 'Dijadwalkan', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    { value: 'shooting', label: 'Pemotretan', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
    { value: 'editing', label: 'Editing', color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
    { value: 'awaiting_payment', label: 'Preview Tersedia', color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
    { value: 'completed', label: 'Selesai', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    { value: 'archived', label: 'Diarsipkan', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
];

export function statusLabel(value) {
    return statusOptions.find((s) => s.value === value)?.label || value;
}

export function StatusBadge({ value }) {
    const item = statusOptions.find((s) => s.value === value);
    return <span className={`badge ${item?.color || ''}`}>{item?.label || value}</span>;
}

const emptyForm = {
    user_id: '',
    client_mode: 'existing',
    client_name: '',
    client_phone: '',
    client_email: '',
    client_notes: '',
    name: '',
    package_id: '',
    service_ids: [],
    event_date: '',
    start_time: '',
    end_time: '',
    description: '',
    location: '',
    price: '',
    dp_amount: '',
    status: 'scheduled',
};

export default function Projects() {
    const { user, can } = useAuth();
    const isAdmin = ['admin', 'owner'].includes(user?.role);
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [status, setStatus] = useState('');
    const [clients, setClients] = useState([]);
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [createdCreds, setCreatedCreds] = useState(null);

    const load = (page = 1) => {
        setLoading(true);
        api.get('/projects', { params: { page, per_page: 15, status: status || undefined } })
            .then(({ data }) => {
                setItems(Array.isArray(data) ? data : data.data);
                setMeta(Array.isArray(data) ? { last_page: 1, current_page: 1 } : data);
            })
            .catch(() => toast.error('Gagal memuat proyek.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [status]);

    useEffect(() => {
        if (isAdmin) api.get('/clients', { params: { per_page: 100 } }).then(({ data }) => setClients(data.data)).catch(() => {});
        if (isAdmin) api.get('/packages', { params: { active_only: 1 } }).then(({ data }) => setPackages(data)).catch(() => {});
        if (isAdmin) api.get('/services').then(({ data }) => setServices(data)).catch(() => {});
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
            user_id: item.user_id || '',
            client_mode: 'existing',
            client_name: '',
            client_phone: '',
            client_email: '',
            client_notes: '',
            name: item.name,
            package_id: item.package_id || '',
            event_date: item.event_date?.split('T')[0] || '',
            start_time: item.event_start ? formatTimeInput(item.event_start) : '',
            end_time: item.event_end ? formatTimeInput(item.event_end) : '',
            description: item.description || '',
            location: item.location || '',
            price: item.price || '',
            dp_amount: item.invoice?.dp_amount || '',
            status: item.status,
        });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = { ...form };
            if (payload.package_id === 'custom') {
                payload.package_id = '';
                delete payload.service_ids; // Backend tak butuh ini untuk manual price
            }
            if (payload.event_date) {
                if (payload.start_time) payload.event_start = `${payload.event_date}T${payload.start_time}`;
                if (payload.end_time) payload.event_end = `${payload.event_date}T${payload.end_time}`;
            }
            delete payload.start_time;
            delete payload.end_time;
            if (editing) {
                await api.put(`/projects/${editing.id}`, payload);
                toast.success('Project diperbarui.');
                load(meta.current_page);
                setOpen(false);
            } else {
                if (payload.client_mode === 'existing') {
                    payload.client_name = '';
                    payload.client_phone = '';
                    payload.client_email = '';
                    payload.client_notes = '';
                } else {
                    payload.user_id = '';
                }
                const { data } = await api.post('/projects', payload);
                toast.success('Project dibuat.');
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
            await copyToClipboard(text);
            toast.success('Kredensial disalin.');
        } catch {
            toast.error('Gagal menyalin.');
        }
    };

    return (
        <>
            <PageHeader
                title={isAdmin ? 'Proyek' : 'Pesanan'}
                subtitle={isAdmin ? 'Kelola project, file, dan status klien.' : 'Pantau progress dan file pesanan Anda.'}
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
                <CardGridSkeleton count={6} cols="md:grid-cols-2 xl:grid-cols-3" ratio="photo" metaLines={2} />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => {
                        const price = item.price ?? null;
                        const totalPaid = (item.payments || []).filter((p) => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount || 0), 0);
                        const remaining = price === null ? null : Number(price) - totalPaid;
                        const hasPreview = (item.files || []).some((f) => (f.category === 'photo' || f.category === 'video') && (f.media_id || f.variant === 'original'));
                        return (
                            <div key={item.id} className="card flex flex-col p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-mono text-xs font-semibold text-ink-muted">PSN-{item.order_no}</p>
                                    <StatusBadge value={item.status} />
                                </div>
                                <h3 className="mt-1 font-bold text-ink">{item.name}</h3>
                                {item.description && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{item.description}</p>}
                                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                                    {isAdmin && (
                                        <span className="flex items-center gap-1.5">
                                            <Icon name="user" size={14} /> {item.user?.name || '-'}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <Icon name="calendar" size={14} />
                                        {item.event_start ? formatDate(item.event_start) : (item.event_date ? formatDate(item.event_date) : 'Segera')}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-ink-muted">Sisa Pembayaran</p>
                                        <p className={`font-bold ${remaining !== null && remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {formatRupiah(remaining)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-ink-muted">Total Tagihan</p>
                                        <p className="font-semibold text-ink">{formatRupiah(price)}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-1 items-end gap-2">
                                    {hasPreview ? (
                                        <>
                                            <Link to={`/dashboard/preview/${item.order_no || item.id}`} className="btn-primary flex-1 justify-center py-2">
                                                <Icon name="eye" size={14} /> Lihat Preview
                                            </Link>
                                            <Link to={`/dashboard/projects/${item.order_no || item.id}`} className="btn-outline justify-center py-2" title="Detail Pesanan">
                                                <Icon name="folder-open" size={14} />
                                            </Link>
                                        </>
                                    ) : (
                                        <Link to={`/dashboard/projects/${item.order_no || item.id}`} className="btn-outline flex-1 justify-center py-2">
                                            <Icon name="folder-open" size={14} /> Detail Pesanan
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                                <Field label="Pilih Klien" required error={errors.user_id?.[0]}>
                                    <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
                                        <option value="">Pilih klien...</option>
                                        {clients.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </Field>
                            ) : (
                                <>
                                    <div className="sm:col-span-2">
                                        <Field label="Nama Klien" required error={errors.client_name?.[0]}>
                                            <input className="input" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
                                        </Field>
                                    </div>
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
                        <Field label="Klien" required error={errors.user_id?.[0]}>
                            <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
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
                    {isAdmin && packages.length > 0 && (
                        <>
                            <Field label="Paket" hint="pilih paket untuk mengisi harga otomatis">
                                <select
                                    className="input"
                                    value={form.package_id}
                                    onChange={(e) => {
                                        const pid = e.target.value;
                                        if (pid === 'custom') {
                                            setForm({ ...form, package_id: pid });
                                            return;
                                        }
                                        const pkg = packages.find((p) => String(p.id) === pid);
                                        setForm({
                                            ...form,
                                            package_id: pid,
                                            name: form.name || (pkg ? pkg.name : ''),
                                            price: pkg ? pkg.price : form.price,
                                            service_ids: [],
                                        });
                                    }}
                                >
                                    <option value="">Tanpa paket (harga manual)</option>
                                    {packages.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} — {formatRupiah(p.price)}</option>
                                    ))}
                                    <option value="custom">Layanan Satuan</option>
                                </select>
                            </Field>
                            <Field label="Tanggal Acara" hint="opsional" error={errors.event_date?.[0]}>
                                <input className="input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                            </Field>
                            <Field label="Waktu Mulai Acara" hint="opsional" error={errors.event_start?.[0]}>
                                <input className="input" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                            </Field>
                            <Field label="Waktu Selesai Acara" hint="opsional" error={errors.event_end?.[0]}>
                                <input className="input" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                            </Field>
                            {form.package_id === 'custom' && (
                                <div className="sm:col-span-2">
                                    <Field label="Pilih Layanan Satuan (bisa lebih dari satu)">
                                        <div className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface p-2">
                                            {services.map(s => (
                                                <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-muted transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        className="h-4 w-4 rounded border-line text-brand-600"
                                                        checked={(form.service_ids || []).includes(s.id)}
                                                        onChange={(e) => {
                                                            const ids = new Set(form.service_ids || []);
                                                            if (e.target.checked) ids.add(s.id);
                                                            else ids.delete(s.id);
                                                            const idArray = Array.from(ids);
                                                            const selectedServices = services.filter(svc => idArray.includes(svc.id));
                                                            const sumPrice = selectedServices.reduce((acc, svc) => acc + Number(svc.price), 0);
                                                            const customName = 'Kustom: ' + selectedServices.map(svc => `${svc.event} (${svc.media})`).join(' + ');
                                                            
                                                            setForm({ 
                                                                ...form, 
                                                                service_ids: idArray,
                                                                name: idArray.length ? customName : '',
                                                                price: idArray.length ? sumPrice : ''
                                                            });
                                                        }}
                                                    />
                                                    <div className="flex flex-1 justify-between text-sm">
                                                        <span className="font-medium text-ink">{s.event} <span className="text-xs text-ink-muted capitalize">({s.media})</span></span>
                                                        <span className="font-semibold text-brand-600 dark:text-brand-400">{formatRupiah(s.price)}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </Field>
                                </div>
                            )}
                            {form.package_id !== 'custom' && (() => {
                                const pkg = packages.find((p) => String(p.id) === form.package_id);
                                if (!pkg) return null;
                                return (
                                    <div className="sm:col-span-2 mt-2 rounded-xl border border-line bg-surface-muted/50 p-3 text-sm">
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
                        </>
                    )}
                    {!(isAdmin && packages.length > 0) && (
                        <>
                            <Field label="Tanggal Acara" hint="opsional" error={errors.event_date?.[0]}>
                                <input className="input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                            </Field>
                            <Field label="Waktu Mulai Acara" hint="opsional" error={errors.event_start?.[0]}>
                                <input className="input" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                            </Field>
                            <Field label="Waktu Selesai Acara" hint="opsional" error={errors.event_end?.[0]}>
                                <input className="input" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                            </Field>
                        </>
                    )}
                    <div className="sm:col-span-2">
                        <Field label="Lokasi" hint="opsional. Tempat acara dilaksanakan.">
                            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="mis. Ballroom Hotel, Lombok" />
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <Field label="Deskripsi" hint="opsional" error={errors.description?.[0]}>
                            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <Field label="Harga (Rp)" hint="opsional. Otomatis terisi dari paket, bisa diubah manual." error={errors.price?.[0]}>
                            <input className="input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                        </Field>
                    </div>
                    {isAdmin && (
                        <div className="sm:col-span-2">
                            <Field label="DP / Uang Muka (Rp)" hint="opsional. Kosongkan jika deal pembayaran di belakang." error={errors.dp_amount?.[0]}>
                                <input className="input" type="number" min="0" value={form.dp_amount} onChange={(e) => setForm({ ...form, dp_amount: e.target.value })} placeholder="mis. 500000" />
                            </Field>
                        </div>
                    )}
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
                                        `Login: ${createdCreds.login_url}\nEmail: ${createdCreds.email}\nKata sandi: ${createdCreds.password}\nDashboard: ${createdCreds.access_url}`
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
                                <span className="text-ink-muted">Tautan Dashboard</span>
                                <button className="icon-btn" onClick={() => copyCreds(createdCreds.access_url)} aria-label="Salin">
                                    <Icon name="link" size={14} />
                                </button>
                            </div>
                            <code className="block truncate text-xs text-ink">{createdCreds.access_url}</code>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
