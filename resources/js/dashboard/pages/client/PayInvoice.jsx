import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';
import { getApiErrorMessage } from '../../lib/errors';
import { toast } from '../../lib/toast';

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

    // Restore state from previous attempts if user navigates via browser back
    useEffect(() => {
        if (step !== 'method' && !selectedMethod) {
            // Can't be on instruction/confirm if no method selected. Redirect to start.
            setSearchParams({ step: 'method' });
        }
    }, [step, selectedMethod, setSearchParams]);

    const setStep = (newStep) => setSearchParams({ step: newStep });

    const handleMethodSelect = (methodSelection) => {
        setSelectedMethod(methodSelection);
        setStep('instructions');
    };

    const handleInstructionsProceed = async () => {
        if (selectedMethod.type === 'gateway') {
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
            }
        } else {
            setStep('confirm');
        }
    };

    if (loading) return <Skeleton variant="form" />;
    
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
                        <p className="text-sm font-mono text-ink-muted">INV-{invoice.number} &middot; {invoice.project}</p>
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
                                isPast ? 'bg-brand-500 border-brand-500 text-white' : 
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
                />
            )}

            {step === 'instructions' && selectedMethod && (
                <PayInvoiceInstructions 
                    invoice={invoice} 
                    method={selectedMethod} 
                    onProceed={handleInstructionsProceed} 
                />
            )}

            {step === 'confirm' && selectedMethod && (
                <PayInvoiceConfirm 
                    invoice={invoice} 
                    method={selectedMethod} 
                    onSuccess={() => navigate('/dashboard/client-invoices')}
                />
            )}
        </div>
    );
}
