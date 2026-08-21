import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, Modal, Confirm, Field, formatRupiah } from '../../components/ui';
import FilterDropdown from '../../components/FilterDropdown';
import Skeleton from '../../components/Skeleton';

const VIEWS = [
    { key: 'master', label: 'Master Layanan', icon: 'briefcase' },
    { key: 'packages', label: 'Paket', icon: 'sparkles' },
];

const MEDIA_OPTIONS = ['photo', 'video', 'drone', 'photobooth', 'livestream'];
const TYPE_OPTIONS = ['satuan', 'bundling', 'combo'];
const PROMO_OPTIONS = [
    { value: 'none', label: 'Tanpa Diskon' },
    { value: 'nominal', label: 'Nominal (Rp)' },
    { value: 'percent', label: 'Persen (%)' },
];

const emptyService = { event: '', media: 'photo', duration: '', terms: '', price: '', active: true, order: 0 };
const emptyPackage = {
    name: '', type: 'bundling', price_mode: 'auto', promo_type: 'none', promo_value: '',
    manual_price: '', description: '', is_featured: false, is_active: true, display_order: 0, items: [], booking_count: 0,
};

export default function Services() {
    const [view, setView] = useState('master');
    const [services, setServices] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [svcOpen, setSvcOpen] = useState(false);
    const [svcEditing, setSvcEditing] = useState(null);
    const [svcForm, setSvcForm] = useState(emptyService);
    const [svcErrors, setSvcErrors] = useState({});
    const [svcSaving, setSvcSaving] = useState(false);
    const [svcDeleting, setSvcDeleting] = useState(null);

    const [pkgOpen, setPkgOpen] = useState(false);
    const [pkgEditing, setPkgEditing] = useState(null);
    const [pkgForm, setPkgForm] = useState(emptyPackage);
    const [pkgErrors, setPkgErrors] = useState({});
    const [pkgSaving, setPkgSaving] = useState(false);
    const [pkgDeleting, setPkgDeleting] = useState(null);

    const [svcSearch, setSvcSearch] = useState('');
    const [svcDebounced, setSvcDebounced] = useState('');
    const [svcStatus, setSvcStatus] = useState('');

    const [pkgSearch, setPkgSearch] = useState('');
    const [pkgDebounced, setPkgDebounced] = useState('');
    const [pkgStatus, setPkgStatus] = useState('');

    const loadSvc = () => {
        api.get('/services', { params: { q: svcDebounced || undefined, status: svcStatus || undefined } })
            .then(({ data }) => setServices(data))
            .catch(() => toast.error('Gagal memuat layanan satuan.'));
    };

    const loadPkg = () => {
        api.get('/packages', { params: { q: pkgDebounced || undefined, status: pkgStatus || undefined } })
            .then(({ data }) => setPackages(data))
            .catch(() => toast.error('Gagal memuat paket.'));
    };

    const loadAll = () => {
        setLoading(true);
        Promise.all([
            api.get('/services', { params: { q: svcDebounced || undefined, status: svcStatus || undefined } }),
            api.get('/packages', { params: { q: pkgDebounced || undefined, status: pkgStatus || undefined } }),
        ])
            .then(([s, p]) => {
                setServices(s.data);
                setPackages(p.data);
            })
            .catch(() => toast.error('Gagal memuat data layanan.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => setSvcDebounced(svcSearch.trim()), 300);
        return () => clearTimeout(timer);
    }, [svcSearch]);

    useEffect(() => {
        const timer = setTimeout(() => setPkgDebounced(pkgSearch.trim()), 300);
        return () => clearTimeout(timer);
    }, [pkgSearch]);

    useEffect(loadSvc, [svcDebounced, svcStatus]);
    useEffect(loadPkg, [pkgDebounced, pkgStatus]);
    
    // Initial load
    useEffect(() => {
        loadAll();
    }, []);

    const openSvcCreate = () => { setSvcEditing(null); setSvcForm(emptyService); setSvcErrors({}); setSvcOpen(true); };
    const openSvcEdit = (item) => {
        setSvcEditing(item);
        setSvcForm({ event: item.event || '', media: item.media || 'photo', duration: item.duration || '', terms: item.terms || '', price: item.price, active: Boolean(item.active), order: item.order || 0 });
        setSvcErrors({});
        setSvcOpen(true);
    };
    const handleSvcSubmit = async (e) => {
        e.preventDefault();
        setSvcSaving(true);
        setSvcErrors({});
        try {
            if (svcEditing) {
                await api.put(`/services/${svcEditing.id}`, svcForm);
                toast.success('Layanan satuan diperbarui.');
            } else {
                await api.post('/services', svcForm);
                toast.success('Layanan satuan ditambahkan.');
            }
            setSvcOpen(false);
            loadAll();
        } catch (err) {
            if (err.response?.data?.errors) setSvcErrors(err.response.data.errors);
            else toast.error(getApiErrorMessage(err, 'Gagal menyimpan.'));
        } finally {
            setSvcSaving(false);
        }
    };
    const handleSvcDelete = async () => {
        try {
            await api.delete(`/services/${svcDeleting.id}`);
            toast.success('Layanan satuan dihapus.');
            setSvcDeleting(null);
            loadAll();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus layanan.'));
        }
    };

    const openPkgCreate = () => { setPkgEditing(null); setPkgForm(emptyPackage); setPkgErrors({}); setPkgOpen(true); };
    const openPkgEdit = (p) => {
        setPkgEditing(p);
        setPkgForm({
            name: p.name, type: p.type, price_mode: p.price_mode, promo_type: p.promo_type || 'none',
            promo_value: p.promo_value ?? '', manual_price: p.manual_price ?? '', description: p.description || '',
            is_featured: Boolean(p.is_featured), is_active: Boolean(p.is_active),
            booking_count: p.booking_count || 0,
            display_order: p.display_order || 0,
            items: (p.items || []).map((i) => ({ service_id: i.service_id, qty: i.qty || 1 })),
        });
        setPkgErrors({});
        setPkgOpen(true);
    };

    const pkgBasePrice = pkgForm.items.reduce((sum, it) => {
        const s = services.find((x) => x.id === it.service_id);
        return sum + (s ? Number(s.price) * (it.qty || 1) : 0);
    }, 0);
    const pkgDiscount = pkgForm.price_mode === 'manual'
        ? Math.max(0, pkgBasePrice - (Number(pkgForm.manual_price) || 0))
        : pkgForm.promo_type === 'percent'
            ? (pkgBasePrice * (Number(pkgForm.promo_value) || 0)) / 100
            : pkgForm.promo_type === 'nominal'
                ? (Number(pkgForm.promo_value) || 0)
                : 0;
    const pkgFinal = pkgForm.price_mode === 'manual'
        ? Number(pkgForm.manual_price) || 0
        : Math.max(0, pkgBasePrice - pkgDiscount);

    const togglePkgItem = (serviceId) => {
        const exists = pkgForm.items.some((i) => i.service_id === serviceId);
        setPkgForm({
            ...pkgForm,
            items: exists
                ? pkgForm.items.filter((i) => i.service_id !== serviceId)
                : [...pkgForm.items, { service_id: serviceId, qty: 1 }],
        });
    };

    const handlePkgSubmit = async (e) => {
        e.preventDefault();
        setPkgSaving(true);
        setPkgErrors({});
        try {
            if (pkgEditing) {
                await api.put(`/packages/${pkgEditing.id}`, pkgForm);
                toast.success('Paket diperbarui.');
            } else {
                await api.post('/packages', pkgForm);
                toast.success('Paket ditambahkan.');
            }
            setPkgOpen(false);
            loadAll();
        } catch (err) {
            if (err.response?.data?.errors) setPkgErrors(err.response.data.errors);
            else toast.error(getApiErrorMessage(err, 'Gagal menyimpan paket.'));
        } finally {
            setPkgSaving(false);
        }
    };
    const handlePkgDelete = async () => {
        try {
            await api.delete(`/packages/${pkgDeleting.id}`);
            toast.success('Paket dihapus.');
            setPkgDeleting(null);
            loadAll();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus paket.'));
        }
    };

    return (
        <>
            <PageHeader
                title="Layanan"
                subtitle="Atur master layanan satuan dan paket (bundling/combo)."
                action={
                    view === 'master' ? (
                        <button className="btn-primary" onClick={openSvcCreate}>
                            <Icon name="plus" size={18} /> Tambah Layanan Satuan
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={openPkgCreate}>
                            <Icon name="plus" size={18} /> Tambah Paket
                        </button>
                    )
                }
            />

            <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
                {VIEWS.map((v) => (
                    <button
                        key={v.key}
                        type="button"
                        onClick={() => setView(v.key)}
                        className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            view === v.key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={v.icon} size={16} /> {v.label}
                    </button>
                ))}
            </div>

            {view === 'master' ? (
                <div className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                    <form className="relative w-full md:w-96" onSubmit={(e) => { e.preventDefault(); setSvcDebounced(svcSearch.trim()); }}>
                        <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            className="input pl-9"
                            placeholder="Cari nama layanan..."
                            value={svcSearch}
                            onChange={(e) => setSvcSearch(e.target.value)}
                        />
                        {svcSearch && (
                            <button type="button" aria-label="Hapus pencarian" onClick={() => { setSvcSearch(''); setSvcDebounced(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                                <Icon name="x" size={14} />
                            </button>
                        )}
                    </form>
                    <div className="ml-auto flex w-full flex-wrap items-center gap-1.5 md:w-auto">
                        <FilterDropdown 
                            title="Filter Status" 
                            icon="toggle-left" 
                            value={svcStatus} 
                            onChange={setSvcStatus} 
                            options={[{key: 'active', label: 'Aktif'}, {key: 'inactive', label: 'Nonaktif'}]} 
                        />
                        <span className="whitespace-nowrap px-2 text-sm text-ink-muted">{services.length || 0} layanan</span>
                    </div>
                </div>
            ) : (
                <div className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                    <form className="relative w-full md:w-96" onSubmit={(e) => { e.preventDefault(); setPkgDebounced(pkgSearch.trim()); }}>
                        <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            className="input pl-9"
                            placeholder="Cari nama paket..."
                            value={pkgSearch}
                            onChange={(e) => setPkgSearch(e.target.value)}
                        />
                        {pkgSearch && (
                            <button type="button" aria-label="Hapus pencarian" onClick={() => { setPkgSearch(''); setPkgDebounced(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                                <Icon name="x" size={14} />
                            </button>
                        )}
                    </form>
                    <div className="ml-auto flex w-full flex-wrap items-center gap-1.5 md:w-auto">
                        <FilterDropdown 
                            title="Filter Status" 
                            icon="toggle-left" 
                            value={pkgStatus} 
                            onChange={setPkgStatus} 
                            options={[{key: 'active', label: 'Aktif'}, {key: 'inactive', label: 'Nonaktif'}]} 
                        />
                        <span className="whitespace-nowrap px-2 text-sm text-ink-muted">{packages.length || 0} paket</span>
                    </div>
                </div>
            )}

            {loading ? (
                <Skeleton variant="table" />
            ) : (
                <>
            {view === 'master' && (
                services.length ? (
                    <div className="card overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Event / Nama</th>
                                    <th>Media</th>
                                    <th>Ketentuan</th>
                                    <th>Durasi</th>
                                    <th>Harga</th>
                                    <th>Status</th>
                                    <th className="w-24 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((s) => (
                                    <tr key={s.id}>
                                        <td className="font-medium text-ink">{s.event || '-'}</td>
                                        <td><span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">{s.media}</span></td>
                                        <td className="text-xs text-ink-muted">{s.terms || '-'}</td>
                                        <td className="text-xs text-ink-muted">{s.duration || '-'}</td>
                                        <td className="font-semibold text-ink">{formatRupiah(s.price)}</td>
                                        <td>
                                            <span className={`badge ${s.active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-zinc-500'}`}>
                                                {s.active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="inline-flex gap-1">
                                                <button onClick={() => openSvcEdit(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                                    <Icon name="edit" size={16} />
                                                </button>
                                                <button onClick={() => setSvcDeleting(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                                    <Icon name="trash" size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState title="Belum ada layanan satuan" message="Tambahkan layanan dasar (event + media + harga)." />
                )
            )}

            {view === 'packages' && (
                packages.length ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {packages.map((p) => (
                            <div key={p.id} className="card p-5">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-ink">{p.name}</h3>
                                            <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">{p.type}</span>
                                            {p.is_featured && <span className="badge bg-amber-500/15 text-amber-600 dark:text-amber-400"><Icon name="star" size={12} /> Unggulan</span>}
                                            {p.booking_count > 0 && <span className="badge bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Populer</span>}
                                            {!p.is_active && <span className="badge bg-zinc-500/15 text-zinc-500">Nonaktif</span>}
                                        </div>
                                        {p.description && <p className="mt-1 text-sm text-ink-muted">{p.description}</p>}
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button onClick={() => openPkgEdit(p)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                            <Icon name="edit" size={16} />
                                        </button>
                                        <button onClick={() => setPkgDeleting(p)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {(p.items || []).map((it, i) => (
                                        <span key={i} className="rounded-lg bg-surface-muted px-2 py-1 text-xs text-ink-muted">
                                            {it.name} {it.qty > 1 ? `x${it.qty}` : ''}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        {p.discount > 0 && (
                                            <>
                                                <p className="text-xs text-ink-muted line-through">{formatRupiah(p.base_price)}</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">Hemat {formatRupiah(p.discount)}</p>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{formatRupiah(p.price)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Belum ada paket" message="Buat paket bundling/combo dari layanan satuan." icon="sparkles" />
                )
            )}
                </>
            )}

            <Modal open={svcOpen} onClose={() => setSvcOpen(false)} title={svcEditing ? 'Edit Layanan Satuan' : 'Tambah Layanan Satuan'} wide footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setSvcOpen(false)}>Batal</button>
                    <button type="submit" form="service-form" className="btn-primary" disabled={svcSaving}>{svcSaving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            }>
                <form id="service-form" onSubmit={handleSvcSubmit} className="space-y-4">
                    <Field label="Event / Nama Layanan" required error={svcErrors.event?.[0]}>
                        <input className="input" value={svcForm.event} onChange={(e) => setSvcForm({ ...svcForm, event: e.target.value })} required placeholder="Akad" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Media" required error={svcErrors.media?.[0]}>
                            <select className="input" value={svcForm.media} onChange={(e) => setSvcForm({ ...svcForm, media: e.target.value })}>
                                {MEDIA_OPTIONS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="Durasi" hint="mis. 3 Jam" error={svcErrors.duration?.[0]}>
                            <input className="input" value={svcForm.duration} onChange={(e) => setSvcForm({ ...svcForm, duration: e.target.value })} />
                        </Field>
                        <Field label="Ketentuan" hint="mis. Edit + Softfile" error={svcErrors.terms?.[0]}>
                            <input className="input" value={svcForm.terms} onChange={(e) => setSvcForm({ ...svcForm, terms: e.target.value })} />
                        </Field>
                        <Field label="Harga (Rp)" required error={svcErrors.price?.[0]}>
                            <input className="input" type="number" min="0" value={svcForm.price} onChange={(e) => setSvcForm({ ...svcForm, price: e.target.value })} required />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Urutan">
                            <input className="input" type="number" min="0" value={svcForm.order} onChange={(e) => setSvcForm({ ...svcForm, order: e.target.value })} />
                        </Field>
                        <Field label="Status">
                            <label className="flex h-[42px] cursor-pointer items-center gap-2 text-sm text-ink">
                                <input type="checkbox" checked={svcForm.active} onChange={(e) => setSvcForm({ ...svcForm, active: e.target.checked })} className="h-4 w-4 rounded border-line text-brand-600" />
                                Aktif di landing
                            </label>
                        </Field>
                    </div>
                </form>
            </Modal>

            <Modal open={pkgOpen} onClose={() => setPkgOpen(false)} title={pkgEditing ? 'Edit Paket' : 'Tambah Paket'} wide footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setPkgOpen(false)}>Batal</button>
                    <button type="submit" form="package-form" className="btn-primary" disabled={pkgSaving}>{pkgSaving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            }>
                <form id="package-form" onSubmit={handlePkgSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                            <Field label="Nama Paket" required error={pkgErrors.name?.[0]}>
                                <input className="input" value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} required placeholder="Wedding Premium" />
                            </Field>
                        </div>
                        <Field label="Tipe" required error={pkgErrors.type?.[0]}>
                            <select className="input" value={pkgForm.type} onChange={(e) => setPkgForm({ ...pkgForm, type: e.target.value })}>
                                {TYPE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <Field label="Isi Paket (layanan satuan)" required>
                        <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-line p-2">
                            {services.map((s) => {
                                const sel = pkgForm.items.find((i) => i.service_id === s.id);
                                return (
                                    <div key={s.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${sel ? 'border-brand-500 bg-brand-500/10' : 'border-line'}`}>
                                        <label className="flex flex-1 cursor-pointer items-center gap-3">
                                            <input type="checkbox" checked={!!sel} onChange={() => togglePkgItem(s.id)} className="h-4 w-4 rounded border-line text-brand-600" />
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium text-ink">{s.event}</span>
                                                <span className="text-xs text-ink-muted">{s.media} {s.duration ? `· ${s.duration}` : ''}</span>
                                            </span>
                                        </label>
                                        {sel ? (
                                            <div className="flex shrink-0 items-center gap-1">
                                                <button type="button" className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted" onClick={() => setPkgForm({ ...pkgForm, items: pkgForm.items.map((i) => i.service_id === s.id ? { ...i, qty: Math.max(1, (i.qty || 1) - 1) } : i) })} aria-label="Kurang">
                                                    <Icon name="x" size={14} />
                                                </button>
                                                <span className="w-6 text-center text-sm font-semibold text-ink">{sel.qty}</span>
                                                <button type="button" className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted" onClick={() => setPkgForm({ ...pkgForm, items: pkgForm.items.map((i) => i.service_id === s.id ? { ...i, qty: (i.qty || 1) + 1 } : i) })} aria-label="Tambah">
                                                    <Icon name="plus" size={14} />
                                                </button>
                                                <span className="ml-2 w-20 text-right text-sm font-semibold text-brand-600 dark:text-brand-400">{formatRupiah(Number(s.price) * (sel.qty || 1))}</span>
                                            </div>
                                        ) : (
                                            <span className="w-20 shrink-0 text-right text-sm text-ink-muted">{formatRupiah(s.price)}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {pkgErrors.items && <p className="mt-1 text-xs text-red-500">{pkgErrors.items[0]}</p>}
                    </Field>

                    <div className="rounded-xl border border-line bg-surface-muted/50 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                            <span className="text-sm text-ink-muted">Harga dasar:</span>
                            <span className="font-bold text-ink">{formatRupiah(pkgBasePrice)}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Mode Harga">
                                <select className="input" value={pkgForm.price_mode} onChange={(e) => setPkgForm({ ...pkgForm, price_mode: e.target.value })}>
                                    <option value="auto">Otomatis (jumlah item − diskon)</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </Field>
                            {pkgForm.price_mode === 'manual' ? (
                                <Field label="Harga Manual (Rp)" error={pkgErrors.manual_price?.[0]}>
                                    <input className="input" type="number" min="0" value={pkgForm.manual_price} onChange={(e) => setPkgForm({ ...pkgForm, manual_price: e.target.value })} />
                                </Field>
                            ) : (
                                <>
                                    <Field label="Diskon">
                                        <select className="input" value={pkgForm.promo_type} onChange={(e) => setPkgForm({ ...pkgForm, promo_type: e.target.value })}>
                                            {PROMO_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    {pkgForm.promo_type !== 'none' && (
                                        <Field label={pkgForm.promo_type === 'percent' ? 'Nilai (%)' : 'Nilai (Rp)'} error={pkgErrors.promo_value?.[0]}>
                                            <input className="input" type="number" min="0" value={pkgForm.promo_value} onChange={(e) => setPkgForm({ ...pkgForm, promo_value: e.target.value })} />
                                        </Field>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                            <div className="flex items-center gap-2">
                                {pkgDiscount > 0 && (
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Hemat {formatRupiah(pkgDiscount)}</span>
                                )}
                            </div>
                            <div>
                                <span className="text-sm text-ink-muted">Harga akhir: </span>
                                <span className="text-xl font-bold text-brand-600 dark:text-brand-400">{formatRupiah(pkgFinal)}</span>
                            </div>
                        </div>
                    </div>

                    <Field label="Deskripsi" hint="opsional" error={pkgErrors.description?.[0]}>
                        <textarea className="input min-h-[60px]" value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Urutan Tampil">
                            <input className="input" type="number" min="0" value={pkgForm.display_order} onChange={(e) => setPkgForm({ ...pkgForm, display_order: e.target.value })} />
                        </Field>
                        <Field label="Label">
                            <div className="flex flex-wrap gap-4 pt-2">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                                    <input type="checkbox" checked={pkgForm.is_featured} onChange={(e) => setPkgForm({ ...pkgForm, is_featured: e.target.checked })} className="h-4 w-4 rounded border-line text-brand-600" />
                                    Unggulan (kartu utama)
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                                    <input type="checkbox" checked={pkgForm.is_active} onChange={(e) => setPkgForm({ ...pkgForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-line text-brand-600" />
                                    Aktif
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-ink-muted">
                                Label "Populer" otomatis dari jumlah booking (status konfirmasi/converted). Saat ini {pkgForm.booking_count || 0} booking.
                            </p>
                        </Field>
                    </div>
                </form>
            </Modal>


            <Confirm open={!!svcDeleting} onClose={() => setSvcDeleting(null)} onConfirm={handleSvcDelete} title="Hapus layanan satuan?" message="Paket yang memakai layanan ini juga akan ikut berubah." />
            <Confirm open={!!pkgDeleting} onClose={() => setPkgDeleting(null)} onConfirm={handlePkgDelete} title="Hapus paket?" message="Project yang sudah memakai paket ini tetap memakai snapshot harga." />
        </>
    );
}