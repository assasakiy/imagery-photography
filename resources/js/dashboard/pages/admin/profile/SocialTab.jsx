import Icon from '../../../components/Icon';
import SocialSelect from '../landing/sections/SocialSelect';
import { SOCIAL_PLATFORMS, SocialLogo } from '../landing/sections/socialPlatforms';

export default function SocialTab({ socials, setSocials, saving, socialsDirty, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="card p-5 lg:col-span-2">
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-ink">
                <Icon name="link" size={18} /> Media Sosial
            </h3>
            <p className="mb-5 text-sm text-ink-muted">Tambahkan akun sosial media Anda yang ingin ditampilkan di profil.</p>

            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Daftar Sosial Media</p>
                <button
                    type="button"
                    className="btn-outline text-xs py-1.5 px-3"
                    onClick={() => setSocials([...socials, { slug: 'instagram', url: '' }])}
                >
                    <Icon name="plus" size={14} /> Tambah
                </button>
            </div>

            {socials.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-line p-4 text-center text-sm text-ink-muted">
                    Belum ada sosial media. Klik "Tambah" untuk mulai.
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    {socials.map((row, i) => (
                        <div key={i} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[200px_1fr_auto]">
                            <SocialSelect value={row.slug || ''} onChange={(slug) => {
                                const next = socials.slice();
                                next[i] = { ...next[i], slug };
                                setSocials(next);
                            }} />
                            <input
                                className="input"
                                placeholder="https://..."
                                value={row.url || ''}
                                onChange={(e) => {
                                    const next = socials.slice();
                                    next[i] = { ...next[i], url: e.target.value };
                                    setSocials(next);
                                }}
                            />
                            <button
                                type="button"
                                className="btn-outline text-red-500 !px-2.5 !py-2"
                                onClick={() => setSocials(socials.filter((_, x) => x !== i))}
                                title="Hapus"
                            >
                                <Icon name="trash" size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {socials.length > 0 && socials.some((r) => r.url) && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {socials.filter((r) => r.url).map((r, i) => {
                        const found = SOCIAL_PLATFORMS.find((p) => p.type === r.slug);
                        return (
                            <span key={i} className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted">
                                <SocialLogo type={r.slug} size={14} className="text-ink" /> {found ? found.label : r.slug}
                            </span>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary" disabled={saving || !socialsDirty}>
                    <Icon name="check" size={16} /> Simpan Media Sosial
                </button>
            </div>
        </form>
    );
}
