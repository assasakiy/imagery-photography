import { useState } from 'react';
import Icon from '../../../../components/Icon';
import MediaPicker from '../../../../components/MediaPicker';
import { Field } from '../../../../components/ui';

const SOCIAL_KEYS = [
    { key: 'social_facebook', label: 'Facebook URL' },
    { key: 'social_instagram', label: 'Instagram URL' },
    { key: 'social_tiktok', label: 'TikTok URL' },
    { key: 'social_whatsapp', label: 'WhatsApp URL' },
];

export default function TeamSection({ tim, team, updateSection }) {
    const [mediaFor, setMediaFor] = useState(null);
    const members = Array.isArray(tim.members) ? tim.members : [];

    const getMember = (userId) => members.find((m) => Number(m.user_id) === Number(userId));
    const setMember = (userId, patch) => {
        const list = members.slice();
        const idx = list.findIndex((m) => Number(m.user_id) === Number(userId));
        if (idx === -1) {
            list.push({ user_id: userId, show: true, ...patch });
        } else {
            list[idx] = { ...list[idx], ...patch };
        }
        updateSection('tim', 'members', list);
    };

    return (
        <>
            <Field label="Judul Kecil">
                <input className="input" value={tim.subtitle || ''} onChange={(e) => updateSection('tim', 'subtitle', e.target.value)} />
            </Field>
            <Field label="Judul">
                <input className="input" value={tim.title || ''} onChange={(e) => updateSection('tim', 'title', e.target.value)} />
            </Field>
            <div className="border-t border-line pt-4">
                <p className="text-sm font-semibold text-ink">Anggota Tim</p>
                <p className="mt-1 text-sm text-ink-muted">Otomatis dari akun admin & owner. Centang untuk tampil; isi field hanya bila ingin override tampilan card (mis. ganti foto profil agar lebih formal). Kosongkan untuk kembali ke profil.</p>
                {!Array.isArray(team) || team.length === 0 ? (
                    <div className="mt-3 rounded-lg border border-line bg-surface-muted/50 p-4 text-sm text-ink-muted">Belum ada akun admin/owner.</div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {team.map((member) => {
                            const m = getMember(member.id);
                            const show = m ? (m.show ?? true) !== false : true;
                            const auto = member;
                            const displayPhoto = (m && m.photo_url) || auto.photo_url || '';

                            return (
                                <details key={member.id} className="rounded-xl border border-line bg-surface-muted/50">
                                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={show}
                                            onChange={(e) => setMember(member.id, { show: e.target.checked })}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4 rounded border-line text-brand-600"
                                        />
                                        <img src={displayPhoto} alt={auto.name} className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-line" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-ink">{auto.name}</p>
                                            <p className="truncate text-xs text-ink-muted">{auto.position}</p>
                                        </div>
                                        <span className="shrink-0 text-xs text-ink-muted">Override</span>
                                        <Icon name="chevron-down" size={16} className="text-ink-muted" />
                                    </summary>
                                    <div className="space-y-4 border-t border-line px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                                                <img src={displayPhoto} alt="" className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" className="btn-outline text-xs py-1.5 px-3" onClick={() => setMediaFor(member.id)}>
                                                    <Icon name="edit" size={14} /> Pilih Foto
                                                </button>
                                                {(m && m.photo_url) && (
                                                    <button type="button" className="btn-outline text-xs py-1.5 px-3 text-red-500" onClick={() => setMember(member.id, { photo_url: '' })}>Hapus Foto</button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <Field label="Nama (override)">
                                                <input className="input" placeholder={auto.name} value={(m && m.name) || ''} onChange={(e) => setMember(member.id, { name: e.target.value })} />
                                            </Field>
                                            <Field label="Posisi / Jabatan (override)">
                                                <input className="input" placeholder={auto.position} value={(m && m.position) || ''} onChange={(e) => setMember(member.id, { position: e.target.value })} />
                                            </Field>
                                        </div>
                                        <Field label="Bio (override)">
                                            <textarea className="input min-h-[70px]" placeholder={auto.bio || 'Bio otomatis dari profil'} value={(m && m.bio) || ''} onChange={(e) => setMember(member.id, { bio: e.target.value })} />
                                        </Field>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {SOCIAL_KEYS.map((s) => (
                                                <Field key={s.key} label={s.label + ' (override)'}>
                                                    <input className="input" placeholder={auto.socials?.[s.key.replace('social_', '')] || 'Otomatis dari profil'} value={(m && m[s.key]) || ''} onChange={(e) => setMember(member.id, { [s.key]: e.target.value })} />
                                                </Field>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                )}
            </div>

            <MediaPicker
                open={mediaFor !== null}
                onClose={() => setMediaFor(null)}
                onSelect={(sel) => {
                    if (mediaFor !== null && sel?.url) {
                        setMember(mediaFor, { photo_url: sel.url });
                        setMediaFor(null);
                    }
                }}
                title="Pilih Foto Anggota"
            />
        </>
    );
}