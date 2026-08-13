const crc16 = (str) => {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) : crc << 1;
            crc &= 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

// Parse EMVCo payload into [[tag, value], ...]
export const parseEMV = (raw) => {
    const out = [];
    let i = 0;
    const s = raw.trim();
    while (i + 4 <= s.length) {
        const tag = s.slice(i, i + 2);
        const len = parseInt(s.slice(i + 2, i + 4), 10);
        if (Number.isNaN(len)) break;
        const value = s.slice(i + 4, i + 4 + len);
        out.push([tag, value]);
        i += 4 + len;
    }
    return out;
};

// Validate and extract merchant info
export function validateQris(raw) {
    if (!raw || !raw.startsWith('000201')) {
        return { valid: false, error: 'Format bukan QRIS (tidak diawali 000201)' };
    }

    try {
        const tags = parseEMV(raw);
        let name = 'Tidak diketahui';
        let method = 'unknown';

        for (const [tag, val] of tags) {
            if (tag === '01') method = val; // 11=Static, 12=Dynamic
            if (tag === '59') name = val;
        }

        if (method === '12') {
            return { valid: false, error: 'QRIS berjenis Dinamis tidak didukung. Harap gunakan QRIS Statis.' };
        }
        if (method !== '11') {
            return { valid: false, error: 'Tipe QRIS tidak valid.' };
        }

        return { valid: true, name, type: 'Statis' };
    } catch {
        return { valid: false, error: 'Gagal membaca format data.' };
    }
}

const len2 = (v) => String(v.length).padStart(2, '0');

// Convert static QRIS string to a dynamic one carrying `amount` (IDR integer).
export function dynamicQris(raw, amount) {
    const amt = String(Math.round(Number(amount) || 0));
    if (!raw || !amt) return raw;

    const tags = parseEMV(raw);
    const body = [];
    let hasAmount = false;

    for (const [tag, value] of tags) {
        if (tag === '63') continue; // drop old CRC block, recompute below
        if (tag === '54') {
            body.push('54' + len2(amt) + amt);
            hasAmount = true;
            continue;
        }
        body.push(tag + len2(value) + value);
    }

    if (!hasAmount) {
        // Insert amount (tag 54) before country code (58) per EMVCo ordering; otherwise append.
        const insertBefore = '58';
        const out = [];
        let inserted = false;
        const chunk = '54' + len2(amt) + amt;
        for (const part of body) {
            if (!inserted && part.slice(0, 2) === insertBefore) {
                out.push(chunk);
                inserted = true;
            }
            out.push(part);
        }
        if (!inserted) out.push(chunk);
        body.length = 0;
        body.push(...out);
    }

    const payload = body.join('') + '6304';
    return payload + crc16(payload);
}

// Short fingerprint for display; does not include emoji.
export function qrisPreview(raw) {
    if (!raw) return '';
    const s = raw.trim();
    return s.length > 32 ? s.slice(0, 14) + '…' + s.slice(-14) : s;
}