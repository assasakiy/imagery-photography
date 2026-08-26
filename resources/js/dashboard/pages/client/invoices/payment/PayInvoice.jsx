import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../../api';
import Icon from '../../../../components/Icon';
import { FormSkeleton } from '../../../../components/Skeleton';
import { getApiErrorMessage } from '../../../../lib/errors';
import { toast } from '../../../../lib/toast';
import { inferType } from '../../../../lib/paymentHelpers';

import PayInvoiceMethodPicker from './PayInvoiceMethodPicker';
import PayInvoiceInstructions from './PayInvoiceInstructions';
import PayInvoiceConfirm from './PayInvoiceConfirm';

export default function PayInvoice() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const step = searchParams.get('step') || 'method';
    
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [proceeding, setProceeding] = useState(false);

    useEffect(() => {
        api.get('/customer/invoices')
            .then(({ data }) => {
                const inv = data.find((it) => it.id === Number(id));
                if (!inv) throw new Error('Tagihan tidak ditemukan.');
                setInvoice(inv);
            })
            .catch((err) => setError(err.message || 'Gagal memuat detail tagihan.'))
            .finally(() => setLoading(false));
    }, [id]);

    // Restore state from previous attempts if user navigates via browser back.
    // For proof_rejected: reconstruct selectedMethod from structured channel data,
    // then fetch fresh payment methods to enrich QRIS payload (avoid stale/missing qris string).
    useEffect(() => {
        if (loading) return;
        if (step !== 'method' && !selectedMethod) {
            const lp = invoice?.latest_payment;
            if (invoice?.payment_state === 'proof_rejected' && lp?.channel_type) {
                const base = {
                    type: 'manual',
                    data: {
                        gtype: lp.channel_type,
                        item: {
                            name: lp.channel_label,
                            number: lp.account_number,
                            holder: lp.account_name,
                            merchant: lp.channel_type === 'qris' ? lp.channel_label : null,
                        },
                        account_name: lp.account_name,
                    },
                };
                // For QRIS: fetch fresh payload from payment methods API to avoid stale/missing qris string
                if (lp.channel_type === 'qris') {
                    api.get('/customer/payment-methods')
                        .then(({ data }) => {
                            const groups = data?.manual?.groups || [];
                            const match = groups
                                .filter(g => inferType(g) === 'qris')
                                .flatMap(g => (g.accounts || []).map(a => ({ group: g, item: a })))
                                .find(e => e.item.merchant === lp.channel_label);
                            if (match) {
                                base.data.item.qris = match.item.qris;
                                base.data.group = match.group;
                            }
                            setSelectedMethod(base);
                        })
                        .catch(() => setSelectedMethod(base));
                } else {
                    setSelectedMethod(base);
                }
            } else {
                setSearchParams({ step: 'method' });
            }
        }
    }, [step, selectedMethod, invoice, loading, setSearchParams]);

    const setStep = (newStep) => setSearchParams({ step: newStep });

    const handleMethodSelect = (methodSelection) => {
        setSelectedMethod(methodSelection);
        setStep('instructions');
    };

    const handleInstructionsProceed = async () => {
        if (selectedMethod.type === 'gateway') {
            setProceeding(true);
            try {
                const res = await api.post(`/projects/${invoice.project_id}/payments/gateway`, {
                    amount: invoice.remaining,
                    method: 'gateway',
                    gateway: 'tripay',
                    gateway_method: selectedMethod.data.code
                });
                if (res.data.checkout_url) {
                    window.location.href = res.data.checkout_url;
                }
            } catch (err) {
                toast.error(getApiErrorMessage(err, 'Gagal membuat tagihan otomatis.'));
            } finally {
                setProceeding(false);
            }
        } else {
            setStep('confirm');
        }
    };

    if (loading) return <FormSkeleton />;
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Icon name="alert-triangle" size={48} className="text-red-500 mb-4" />
                <h2 className="text-lg font-bold text-ink">{error}</h2>
                <Link to="/dashboard/client-invoices" className="mt-4 btn-primary">Kembali ke Daftar Tagihan</Link>
            </div>
        );
    }

    if (!invoice || invoice.remaining <= 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Icon name="check-circle" size={48} className="text-emerald-500 mb-4" />
                <h2 className="text-lg font-bold text-ink">Tagihan Lunas</h2>
                <p className="mt-2 text-ink-muted">Tagihan ini sudah lunas atau tidak membutuhkan pembayaran saat ini.</p>
                <Link to="/dashboard/client-invoices" className="mt-4 btn-primary">Kembali ke Daftar Tagihan</Link>
            </div>
        );
    }

    if (invoice.payment_state === 'pending_verification') {
        return (
            <div className="mx-auto mt-8 max-w-md">
                <div className="card flex flex-col items-center p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Icon name="clock" size={30} />
                    </div>
                    <h2 className="text-lg font-bold text-ink">Bukti Sedang Diverifikasi</h2>
                    <p className="mt-2 text-sm text-ink-muted">
                        Pembayaran untuk tagihan ini sudah Anda kirim dan sedang kami periksa. Mohon tunggu konfirmasi dari tim kami sebelum melakukan pembayaran lain.
                    </p>
                    <Link to="/dashboard/client-invoices" className="mt-6 btn-primary">Kembali ke Daftar Tagihan</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => step === 'method' ? navigate('/dashboard/client-invoices') : setStep(step === 'confirm' ? 'instructions' : 'method')}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface hover:bg-surface-muted transition-colors"
                        title="Kembali"
                    >
                        <Icon name="arrow-left" size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-ink">Pembayaran Tagihan</h1>
                        <p className="text-sm font-mono text-ink-muted">
                            {invoice.number.startsWith('INV-') ? invoice.number : `INV-${invoice.number}`} &middot; {invoice.project}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-8 flex items-center justify-between relative px-2 sm:px-12">
                <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-line"></div>
                {['Pilih Metode', 'Instruksi', 'Konfirmasi'].map((label, idx) => {
                    const stepKeys = ['method', 'instructions', 'confirm'];
                    const stepIdx = stepKeys.indexOf(step);
                    const isPast = idx < stepIdx;
                    const isCurrent = idx === stepIdx;
                    
                    return (
                        <div key={label} className="flex flex-col items-center gap-2 bg-body px-4">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                                isPast ? 'action-surface border-[var(--action-bg)]' :
                                isCurrent ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-surface' : 
                                'border-line text-ink-muted bg-surface'
                            }`}>
                                {isPast ? <Icon name="check" size={14} /> : (idx + 1)}
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-ink' : 'text-ink-muted'}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {step === 'method' && (
                <PayInvoiceMethodPicker 
                    invoice={invoice} 
                    onSelectMethod={handleMethodSelect}
                    initialSelected={selectedMethod}
                />
            )}

            {step === 'instructions' && selectedMethod && (
                <PayInvoiceInstructions
                    invoice={invoice}
                    method={selectedMethod}
                    loading={proceeding}
                    onProceed={handleInstructionsProceed}
                    onBack={() => setStep('method')}
                />
            )}

            {step === 'confirm' && selectedMethod && (
                <PayInvoiceConfirm 
                    invoice={invoice} 
                    method={selectedMethod} 
                    onSuccess={() => navigate('/dashboard/client-invoices')}
                    onBack={() => setStep('method')}
                />
            )}
        </div>
    );
}
