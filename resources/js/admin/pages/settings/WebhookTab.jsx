import Button from '../../components/Button';
import { Field } from '../../components/ui';
import { TAB_FIELDS } from './constants';

export default function WebhookTab({ ctx }) {
    const { form, errors, saving, set, save, dirty } = ctx;

    return (
        <div className="card w-full p-6">
            <div className="mb-5">
                <h2 className="font-semibold text-ink">Webhook</h2>
                <p className="text-xs text-ink-muted">URL dipisah baris. Akan dipanggil saat event penting terjadi.</p>
            </div>
            <Field label="URL Webhook" hint="opsional" error={errors.webhook_urls?.[0]}>
                <textarea className="input min-h-[180px]" placeholder={'https://example.com/hooks/imager\nhttps://hook.site/...'} value={form.webhook_urls} onChange={(e) => set('webhook_urls', e.target.value)} />
            </Field>
            <div className="mt-6 flex justify-end border-t border-line pt-5">
                <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.webhook)} onClick={() => save(TAB_FIELDS.webhook)}>Simpan Webhook</Button>
            </div>
        </div>
    );
}