import Button from '../../../components/Button';
import Toggle from '../../../components/Toggle';
import RichEditor from '../../../components/RichEditor';
import { Field } from '../../../components/ui';
import { TAB_FIELDS } from './constants';

export default function MaintenanceTab({ form, errors, saving, set, save, dirty }) {
    const active = !!form.maintenance_enabled;

    return (
        <div className="space-y-6">
            <div className="card w-full p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-ink">Mode Pemeliharaan</h2>
                        <p className="text-xs text-ink-muted">Nonaktifkan akses publik sementara situs dalam perawatan.</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-ink-muted'}`}>
                        {active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <div className="space-y-5">
                    <Toggle label="Aktifkan Mode Pemeliharaan" checked={active} onChange={(v) => set('maintenance_enabled', v)} />
                    <Field label="Pesan Pemeliharaan" error={errors.maintenance_message?.[0]}>
                        <RichEditor variant="mini" value={form.maintenance_message} onChange={(v) => set('maintenance_message', v)} minHeight={120} maxHeight={200} placeholder="Situs sedang dalam pemeliharaan…" />
                    </Field>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.maintenance)} onClick={() => save(TAB_FIELDS.maintenance)}>
                        Simpan Pemeliharaan
                    </Button>
                </div>
            </div>
        </div>
    );
}
