import { toast } from './toast';

export const copyToClipboard = async (text, successMsg = 'Berhasil disalin') => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            toast.success(successMsg);
            return true;
        } else {
            // Fallback for non-HTTPS or unsupported browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
            document.body.prepend(textArea);
            textArea.select();
            
            const successful = document.execCommand('copy');
            textArea.remove();
            
            if (successful) {
                toast.success(successMsg);
                return true;
            } else {
                throw new Error('Fallback copy failed');
            }
        }
    } catch (error) {
        toast.error('Gagal menyalin. Browser Anda tidak mendukung.');
        return false;
    }
};
