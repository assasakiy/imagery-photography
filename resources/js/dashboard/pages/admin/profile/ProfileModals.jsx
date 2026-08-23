import Icon from '../../../components/Icon';
import { Modal, Field, PasswordInput } from '../../../components/ui';

export function AvatarViewModal({ open, onClose, avatarUrl }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Foto Profil"
            fullscreen
            bodyClassName="bg-zinc-950 flex items-center justify-center"
        >
            <div className="flex min-h-[60vh] items-center justify-center">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto profil" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
                ) : (
                    <p className="text-sm text-zinc-400">Belum ada foto profil.</p>
                )}
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

export function CoverViewModal({ open, onClose, coverUrl }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Banner Profil"
            fullscreen
            bodyClassName="bg-zinc-950 flex items-center justify-center"
        >
            <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
                {coverUrl ? (
                    <img src={coverUrl} alt="Banner profil" className="max-h-[85vh] w-full max-w-5xl rounded-xl object-contain" />
                ) : (
                    <p className="text-sm text-zinc-400">Belum ada banner.</p>
                )}
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
