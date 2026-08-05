import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import IconPicker from '../components/IconPicker';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast, formatRupiah } from '../components/ui';

const emptyForm = { title: '', description: '', icon: 'camera', starting_price: '', order: 0 };

const emptyCategory = {
    label: '',
    title: '',
    description: '',
    layout: 'table',
    columns: ['Layanan', 'Harga'],
    published: true,
    order: 0,
    items: [],
};

const VIEWS = [
    { key: 'services', label: 'Layanan', icon: 'briefcase' },
    { key: 'categories', label: 'Kategori Harga', icon: 'file' },
];

export default function Services() {
    const [view, setView] = useState('services');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const [categories, setCategories] = useState([]);
    const [catOpen, setCatOpen] = useState(false);
    const [catEditing, setCatEditing] = useState(null);
    const [catForm, setCatForm] = useState(emptyCategory);
    const [catErrors, setCatErrors] = useState({});
    const [catSaving, setCatSaving] = useState(false);
    const [catDeleting, setCatDeleting] = useState(null);

    const [iconOpen, setIconOpen] = useState(false);
    const { show, node } = useToast();

    const load = () => {
        setLoading(true);
        api.get('/services')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };

    const loadCategories = () => {
        api.get('/service-categories').then(({ data }) => setCategories(data));
    };

    useEffect(() => {
        load();
        loadCategories();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ title: item.title, description: item.description || '', icon: item.icon || 'camera', starting_price: item.starting_price, order: item.order || 0 });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/services/${editing.id}`, form);
                show('Layanan diperbarui.');
            } else {
                await api.post('/services', form);
                show('Layanan ditambahkan.');
            }
            load();
            setOpen(false);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await api.delete(`/services/${deleting.id}`);
        show('Layanan dihapus.');
        setDeleting(null);
        load();
    };

    const openCatCreate = () => {
        setCatEditing(null);
        setCatForm(emptyCategory);
        setCatErrors({});
        setCatOpen(true);
    };

    const openCatEdit = (cat) => {
        setCatEditing(cat);
        setCatForm({
            label: cat.label || '',
            title: cat.title,
            description: cat.description || '',
            layout: cat.layout || 'table',
            columns: cat.columns?.length ? cat.columns : ['Layanan', 'Harga'],
            published: Boolean(cat.published),
            order: cat.order || 0,
            items: (cat.items || []).map((i) => ({ name: i.name, values: i.values || [] })),
        });
        setCatErrors({});
        setCatOpen(true);
    };

    const updateCatItem = (idx, field, value) => {
        setCatForm({ ...catForm, items: catForm.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)) });
    };

    const handleCatSubmit = async (e) => {
        e.preventDefault();
        setCatSaving(true);
        setCatErrors({});
        const payload = {
            ...catForm,
            columns: catForm.layout === 'grid' ? [] : catForm.columns.filter((c) => c.trim() !== ''),
            items: catForm.items
                .filter((it) => it.name.trim() !== '')
                .map((it) => ({ name: it.name, values: it.values || [] })),
        };
        try {
            if (catEditing) {
                await api.put(`/service-categories/${catEditing.id}`, payload);
                show('Kategori harga diperbarui.');
            } else {
                await api.post('/service-categories', payload);
                show('Kategori harga ditambahkan.');
            }
            loadCategories();
            setCatOpen(false);
        } catch (err) {
            if (err.response?.data?.errors) setCatErrors(err.response.data.errors);
            else show('Gagal menyimpan kategori.', 'error');
        } finally {
            setCatSaving(false);
        }
    };

    const handleCatDelete = async () => {
        await api.delete(`/service-categories/${catDeleting.id}`);
        show('Kategori harga dihapus.');
        setCatDeleting(null);
        loadCategories();
    };

    if (loading && !items.length) return <Spinner />;

    const footer = (
        <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
            <button type="submit" form="service-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
    );

    const catFooter = (
        <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setCatOpen(false)}>Batal</button>
            <button type="submit" form="category-form" className="btn-primary" disabled={catSaving}>{catSaving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
    );

    return (
        <>
            <PageHeader
                title="Layanan"
                subtitle="Kelola layanan dan harga yang tampil di halaman Layanan."
                action={
                    view === 'categories' ? (
                        <button className="btn-primary" onClick={openCatCreate}>
                            <Icon name="plus" size={16} /> Tambah Kategori
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={openCreate}>
                            <Icon name="plus" size={18} /> Tambah Layanan
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

            {view === 'services' ? (
                items.length ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((item) => (
                            <div key={item.id} className="card group relative p-5">
                                <div className="absolute right-3 top-3 flex gap-1">
                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-ink-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-brand-600 group-hover:opacity-100" aria-label="Edit">
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button onClick={() => setDeleting(item)} className="rounded-lg p-1.5 text-ink-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-red-500 group-hover:opacity-100" aria-label="Hapus">
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                    <Icon name={item.icon} size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-ink">{item.title}</h3>
                                    <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
                                </div>
                                <p className="mt-3 font-bold text-brand-600 dark:text-brand-400">{formatRupiah(item.starting_price)}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Belum ada layanan" />
                )
            ) : (
                <>
                    {categories.length ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {categories.map((cat) => (
                    <div key={cat.id} className="card p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-ink">{cat.title}</h3>
                                    <span className={`badge ${cat.published ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-zinc-500'}`}>
                                        {cat.published ? 'Tampil' : 'Disembunyikan'}
                                    </span>
                                    <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                        {cat.layout === 'grid' ? 'Grid' : 'Tabel'}
                                    </span>
                                </div>
                                {cat.label && <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-muted">{cat.label}</p>}
                                {cat.description && <p className="mt-1 text-sm text-ink-muted">{cat.description}</p>}
                            </div>
                            <div className="flex shrink-0 gap-1">
                                <button onClick={() => openCatEdit(cat)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                    <Icon name="edit" size={16} />
                                </button>
                                <button onClick={() => setCatDeleting(cat)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                    <Icon name="trash" size={16} />
                                </button>
                            </div>
                        </div>

                        {cat.items?.length ? (
                            cat.layout === 'table' && cat.columns?.length ? (
                                <div className="mt-2 overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                                                {cat.columns.map((col, i) => (
                                                    <th key={i} className="px-3 py-2 font-semibold">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cat.items.map((it, i) => (
                                                <tr key={i} className="border-b border-line/50 last:border-0">
                                                    <td className="px-3 py-2 font-semibold text-ink">{it.name}</td>
                                                    {(it.values || []).map((v, j) => (
                                                        <td key={j} className="px-3 py-2 text-ink">{v}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {cat.items.map((it, i) => (
                                        <span key={i} className="inline-flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                                            <span className="font-semibold text-ink">{it.name}</span>
                                            <span className="font-bold text-brand-600 dark:text-brand-400">{it.values?.[0]}</span>
                                        </span>
                                    ))}
                                </div>
                            )
                        ) : (
                            <p className="mt-2 text-sm text-ink-muted">Belum ada item.</p>
                        )}
                    </div>
                ))}
                        </div>
                    ) : (
                        <EmptyState title="Belum ada kategori harga" message="Tambahkan kategori pertama Anda." icon="briefcase" />
                    )}
                </>
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Layanan' : 'Tambah Layanan'} footer={footer}>
                <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Nama Layanan" required error={errors.title?.[0]}>
                        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </Field>
                    <Field label="Deskripsi" hint="opsional" error={errors.description?.[0]}>
                        <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </Field>
                    <Field label="Ikon">
                        <button
                            type="button"
                            onClick={() => setIconOpen(true)}
                            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-ink hover:bg-surface-muted"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                <Icon name={form.icon} size={20} />
                            </span>
                            <span className="text-sm font-medium">{form.icon}</span>
                            <Icon name="edit" size={14} className="ml-auto text-ink-muted" />
                        </button>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Harga Mulai" hint="opsional" error={errors.starting_price?.[0]}>
                            <input className="input" type="number" min="0" value={form.starting_price} onChange={(e) => setForm({ ...form, starting_price: e.target.value })} />
                        </Field>
                        <Field label="Urutan">
                            <input className="input" type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                        </Field>
                    </div>
                </form>
            </Modal>

            <Modal open={catOpen} onClose={() => setCatOpen(false)} title={catEditing ? 'Edit Kategori Harga' : 'Tambah Kategori Harga'} wide footer={catFooter}>
                <form id="category-form" onSubmit={handleCatSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Label" hint="mis. I. Satuan">
                            <input className="input" value={catForm.label} onChange={(e) => setCatForm({ ...catForm, label: e.target.value })} placeholder="I. Satuan" />
                        </Field>
                        <Field label="Judul" required error={catErrors.title?.[0]}>
                            <input className="input" value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} required placeholder="Paket Stand-Alone" />
                        </Field>
                    </div>

                    <Field label="Deskripsi" hint="opsional" error={catErrors.description?.[0]}>
                        <textarea className="input min-h-[70px]" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="Tampilan">
                            <select className="input" value={catForm.layout} onChange={(e) => setCatForm({ ...catForm, layout: e.target.value })}>
                                <option value="table">Tabel</option>
                                <option value="grid">Grid / Kartu</option>
                            </select>
                        </Field>
                        <Field label="Urutan">
                            <input className="input" type="number" min="0" value={catForm.order} onChange={(e) => setCatForm({ ...catForm, order: e.target.value })} />
                        </Field>
                        <Field label="Status">
                            <label className="flex h-[42px] cursor-pointer items-center gap-2 text-sm text-ink">
                                <input type="checkbox" checked={catForm.published} onChange={(e) => setCatForm({ ...catForm, published: e.target.checked })} className="h-4 w-4 rounded border-line text-brand-600" />
                                Tampilkan di publik
                            </label>
                        </Field>
                    </div>

                    {catForm.layout === 'table' && (
                        <Field label="Kolom Tabel" hint="kolom pertama selalu nama layanan">
                            <div className="space-y-2">
                                {catForm.columns.map((col, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            className="input flex-1"
                                            value={col}
                                            placeholder={i === 0 ? 'Layanan / Paket' : `Kolom ${i}`}
                                            onChange={(e) => setCatForm({ ...catForm, columns: catForm.columns.map((c, j) => (j === i ? e.target.value : c)) })}
                                        />
                                        {catForm.columns.length > 1 && (
                                            <button
                                                type="button"
                                                className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-red-500"
                                                onClick={() => setCatForm({ ...catForm, columns: catForm.columns.filter((_, j) => j !== i) })}
                                                aria-label="Hapus kolom"
                                            >
                                                <Icon name="x" size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn-outline" onClick={() => setCatForm({ ...catForm, columns: [...catForm.columns, ''] })}>
                                    <Icon name="plus" size={14} /> Tambah Kolom
                                </button>
                            </div>
                        </Field>
                    )}

                    <div>
                        <label className="label">Item / Baris</label>
                        <div className="space-y-2">
                            {catForm.items.map((it, idx) => (
                                <div key={idx} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-muted/40 p-2">
                                    <input
                                        className="input w-40 flex-1 sm:flex-none"
                                        placeholder="Nama"
                                        value={it.name}
                                        onChange={(e) => updateCatItem(idx, 'name', e.target.value)}
                                    />
                                    {catForm.layout === 'table'
                                        ? catForm.columns.map((col, ci) => (
                                              <input
                                                  key={ci}
                                                  className="input w-32 flex-1"
                                                  placeholder={ci === 0 ? 'Layanan' : `Harga ${ci}`}
                                                  value={it.values?.[ci - 1] || ''}
                                                  onChange={(e) => {
                                                      const vals = [...(it.values || [])];
                                                      vals[ci - 1] = e.target.value;
                                                      updateCatItem(idx, 'values', vals);
                                                  }}
                                              />
                                          ))
                                        : (
                                            <input
                                                className="input w-32 flex-1"
                                                placeholder="Harga"
                                                value={it.values?.[0] || ''}
                                                onChange={(e) => updateCatItem(idx, 'values', [e.target.value])}
                                            />
                                        )}
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-red-500"
                                        onClick={() => setCatForm({ ...catForm, items: catForm.items.filter((_, j) => j !== idx) })}
                                        aria-label="Hapus item"
                                    >
                                        <Icon name="x" size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() =>
                                    setCatForm({
                                        ...catForm,
                                        items: [...catForm.items, { name: '', values: catForm.layout === 'table' ? catForm.columns.slice(1).map(() => '') : [''] }],
                                    })
                                }
                            >
                                <Icon name="plus" size={14} /> Tambah Item
                            </button>
                        </div>
                        {catErrors.items && <p className="mt-1 text-xs text-red-500">{catErrors.items[0]}</p>}
                    </div>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
            <Confirm open={!!catDeleting} onClose={() => setCatDeleting(null)} onConfirm={handleCatDelete} title="Hapus kategori harga?" message="Semua item di dalam kategori ini juga akan dihapus." />
            <IconPicker open={iconOpen} onClose={() => setIconOpen(false)} value={form.icon} onSelect={(name) => setForm({ ...form, icon: name })} />
            {node}
        </>
    );
}
