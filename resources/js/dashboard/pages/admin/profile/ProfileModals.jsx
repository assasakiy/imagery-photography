import Icon from '../../../components/Icon';
import Avatar from '../../../components/Avatar';
import { Modal, Field, PasswordInput } from '../../../components/ui';

export function AvatarViewModal({ open, onClose, avatarUrl, profile, onEdit, onRemove }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Lihat Foto Profil"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={onEdit}>
                        <Icon name="edit" size={16} /> Ubah
                    </button>
                    {avatarUrl && (
                        <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={onRemove}>
                            <Icon name="trash" size={16} /> Hapus
                        </button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col items-center gap-4 py-2">
                <Avatar
                    src={avatarUrl}
                    name={profile.full_name}
                    size="2xl"
                    shape="full"
                    className="!h-40 !w-40 ring-4 ring-line"
                />
                <div className="text-center">
                    <p className="text-lg font-semibold text-ink">{profile.full_name || '…'}</p>
                    <p className="text-sm text-ink-muted">{profile.email || ''}</p>
                    {profile.bio && <p className="mt-3 max-w-xs text-sm text-ink-muted">{profile.bio}</p>}
                </div>
            </div>
        </Modal>
    );
}

export function AvatarRemoveModal({ open, onClose, saving, onConfirm }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Hapus Foto Profil"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>Batal</button>
                    <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={onConfirm} disabled={saving}>
                        <Icon name="trash" size={16} /> {saving ? 'Menghapus…' : 'Hapus'}
                    </button>
                </div>
            }
        >
            <p className="text-sm text-ink-muted">Hapus foto profil Anda? Tindakan ini hanya menghapus foto profil, bukan akun.</p>
        </Modal>
    );
}

export function CoverViewModal({ open, onClose, coverUrl, onEdit, onRemove }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Lihat Banner Profil"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={onEdit}>
                        <Icon name="edit" size={16} /> Ubah
                    </button>
                    {coverUrl && (
                        <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={onRemove}>
                            <Icon name="trash" size={16} /> Hapus
                        </button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col items-center gap-4 py-2">
                <div className="h-40 w-full overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-line sm:h-48">
                    {coverUrl ? (
                        <img src={coverUrl} alt="Banner profil" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-brand-700 via-brand-500 to-brand-400" />
                    )}
                </div>
                <p className="text-sm text-ink-muted">
                    Banner ini ditampilkan di bagian atas profil Anda.
                </p>
            </div>
        </Modal>
    );
}

export function CoverRemoveModal({ open, onClose, saving, onConfirm }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Hapus Banner Profil"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>Batal</button>
                    <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={onConfirm} disabled={saving}>
                        <Icon name="trash" size={16} /> {saving ? 'Menghapus…' : 'Hapus'}
                    </button>
                </div>
            }
        >
            <p className="text-sm text-ink-muted">Hapus banner profil Anda? Tindakan ini hanya menghapus banner, bukan akun.</p>
        </Modal>
    );
}

export function DeleteAccountModal({ open, onClose, deleting, errors, deletePass, setDeletePass, onSubmit }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Hapus Akun"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={onClose} disabled={deleting}>Batal</button>
                    <button type="submit" form="delete-account-form" className="btn bg-red-600 text-white hover:bg-red-700" disabled={deleting}>
                        <Icon name="trash" size={16} /> {deleting ? 'Menghapus…' : 'Hapus Akun'}
                    </button>
                </div>
            }
        >
            <form id="delete-account-form" onSubmit={onSubmit}>
                <p className="text-sm text-ink-muted">
                    Tindakan ini akan menonaktifkan akun. Setelah masa jeda (grace period) berakhir, seluruh data akan dihapus permanen. Masukkan kata sandi Anda untuk mengonfirmasi.
                </p>
                <div className="mt-4">
                    <Field label="Kata sandi" required error={errors.password?.[0]}>
                        <PasswordInput value={deletePass} onChange={(e) => setDeletePass(e.target.value)} required />
                    </Field>
                </div>
            </form>
        </Modal>
    );
}
