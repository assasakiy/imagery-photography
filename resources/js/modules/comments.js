import { csrfToken, escapeHTML } from './utils';

const formatCommentBody = (body) => escapeHTML(body).replace(/(^|\s)(@[\p{L}\p{N}_.-]+)/gu, '$1<span class="font-semibold text-brand-600 dark:text-brand-400">$2</span>');

export function initComments() {
    const commentsList = document.querySelector('[data-comments-list]');
    const commentsForm = document.querySelector('[data-comment-form]');
    const commentsCountEl = document.querySelector('[data-comments-count]');
    const replyContext = commentsForm?.querySelector('[data-comment-reply-context]');
    const replyName = commentsForm?.querySelector('[data-comment-reply-name]');
    const replyCancel = commentsForm?.querySelector('[data-comment-reply-cancel]');
    let replyParentId = null;

    const renderComment = (comment, nested = false, parentName = '', rootId = null) => {
        const avatarSize = nested ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';
        const avatar = comment.user?.avatar
            ? `<img src="${escapeHTML(comment.user.avatar)}" alt="" class="${avatarSize} rounded-full object-cover ring-1 ring-line">`
            : `<span class="flex ${avatarSize} items-center justify-center rounded-full bg-brand-500/15 font-bold text-brand-600 dark:text-brand-400">${escapeHTML((comment.user?.name || '?').charAt(0).toUpperCase())}</span>`;
        const officialTeamBadge = comment.user?.official_team
            ? `<span title="Tim Resmi" aria-label="Tim Resmi" class="inline-flex h-[17px] w-[17px] shrink-0 self-center align-middle text-brand-600 dark:text-brand-400"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg></span>`
            : '';
        const replyTargetId = nested ? rootId : comment.id;
        const replyBtn = commentsForm
            ? `<button type="button" data-comment-reply="${replyTargetId}" data-comment-reply-name="${escapeHTML(comment.user?.name || 'Subscriber')}" data-comment-reply-username="${escapeHTML(comment.user?.username || '')}" data-comment-mention="${nested ? '1' : '0'}" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>Balas</button>`
            : '';
        const deleteBtn = comment.can_delete
            ? `<button type="button" data-comment-delete="${comment.id}" class="text-xs text-ink-muted hover:text-rose-600">Hapus</button>`
            : '';
        const replies = !nested && comment.replies?.length
            ? `<div class="ml-12 mt-3 sm:ml-14">
                    <button type="button" data-replies-toggle="${comment.id}" aria-expanded="false" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                        <svg data-replies-chevron xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="transition-transform"><path d="m6 9 6 6 6-6"/></svg>
                        <span data-replies-label>Lihat ${comment.replies.length} balasan</span>
                    </button>
                    <div data-replies-list="${comment.id}" hidden class="relative mt-3 space-y-3 border-l-2 border-brand-500/20 pl-5">${comment.replies.map((reply) => renderComment(reply, true, comment.user?.name || 'Subscriber', comment.id)).join('')}</div>
                </div>`
            : '';
        const replyLabel = nested
            ? `<p class="mb-1 text-[11px] text-ink-muted">Membalas <span class="font-semibold text-brand-600 dark:text-brand-400">${escapeHTML(parentName)}</span></p>`
            : '';

        return `
            <div data-comment-id="${comment.id}" class="${nested ? 'relative rounded-xl border border-line/70 bg-surface-muted/50 p-3 before:absolute before:-left-[1.35rem] before:top-6 before:h-px before:w-5 before:bg-brand-500/20' : 'rounded-2xl border border-line bg-surface p-4 shadow-sm'}">
                <div class="flex gap-3">
                    <div class="shrink-0">${avatar}</div>
                    <div class="min-w-0 flex-1">
                        ${replyLabel}
                        <div class="flex flex-wrap items-baseline gap-2">
                            <span class="text-sm font-semibold text-ink">${escapeHTML(comment.user?.name || 'Subscriber')}</span>
                            ${officialTeamBadge}
                            <span class="text-xs text-ink-muted">${escapeHTML(comment.created_at_rel || '')}</span>
                        </div>
                        <p class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">${formatCommentBody(comment.body)}</p>
                        ${(replyBtn || deleteBtn) ? `<div class="mt-2.5 flex items-center gap-3">${replyBtn}${deleteBtn}</div>` : ''}
                    </div>
                </div>
                ${replies}
            </div>`;
    };

    const renderComments = (comments) => {
        if (!commentsList) return;
        if (!comments.length) {
            commentsList.innerHTML = '<p class="text-sm text-ink-muted">Belum ada komentar. Jadilah yang pertama.</p>';
            return;
        }
        commentsList.innerHTML = comments.map((comment) => renderComment(comment)).join('');
    };

    const loadComments = async () => {
        const postId = document.querySelector('[data-comments-section]')?.getAttribute('data-post-id');
        if (!postId) return;
        try {
            const res = await fetch(`/api/comments/blog/${postId}`, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            const data = await res.json();
            renderComments(data || []);
        } catch (e) { /* ignore */ }
    };

    if (commentsList) {
        loadComments();

        commentsList.addEventListener('click', async (e) => {
            const toggleBtn = e.target.closest('[data-replies-toggle]');
            if (toggleBtn) {
                const id = toggleBtn.getAttribute('data-replies-toggle');
                const list = commentsList.querySelector(`[data-replies-list="${id}"]`);
                if (!list) return;
                const opening = list.hidden;
                list.hidden = !opening;
                toggleBtn.setAttribute('aria-expanded', opening ? 'true' : 'false');
                toggleBtn.querySelector('[data-replies-chevron]')?.classList.toggle('rotate-180', opening);
                const label = toggleBtn.querySelector('[data-replies-label]');
                if (label) label.textContent = opening ? 'Sembunyikan balasan' : `Lihat ${list.children.length} balasan`;
                return;
            }

            const replyBtn = e.target.closest('[data-comment-reply]');
            if (replyBtn && commentsForm) {
                replyParentId = Number(replyBtn.getAttribute('data-comment-reply'));
                if (replyName) replyName.textContent = replyBtn.getAttribute('data-comment-reply-name') || 'Subscriber';
                if (replyContext) replyContext.hidden = false;
                commentsForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const body = commentsForm.querySelector('[data-comment-body]');
                if (body) {
                    const targetName = replyBtn.getAttribute('data-comment-reply-name') || 'Subscriber';
                    body.placeholder = `Tulis balasan untuk ${targetName}…`;
                    if (replyBtn.getAttribute('data-comment-mention') === '1') {
                        const username = replyBtn.getAttribute('data-comment-reply-username');
                        if (username) {
                            const mention = `@${username} `;
                            if (!body.value.startsWith(mention)) body.value = mention + body.value;
                        }
                    }
                    setTimeout(() => {
                        body.focus();
                        body.setSelectionRange(body.value.length, body.value.length);
                    }, 300);
                }
                return;
            }

            const deleteBtn = e.target.closest('[data-comment-delete]');
            if (!deleteBtn) return;
            const id = deleteBtn.getAttribute('data-comment-delete');
            if (!confirm('Hapus komentar ini? Balasan di bawahnya juga akan terhapus.')) return;
            try {
                const res = await fetch(`/api/comments/${id}`, {
                    method: 'DELETE',
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrfToken() },
                });
                if (res.ok) loadComments();
            } catch (err) { /* ignore */ }
        });
    }

    replyCancel?.addEventListener('click', () => {
        replyParentId = null;
        if (replyContext) replyContext.hidden = true;
        const body = commentsForm?.querySelector('[data-comment-body]');
        if (body) body.placeholder = 'Tulis komentar Anda…';
    });

    if (commentsForm) {
        commentsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = commentsForm.querySelector('[data-comment-body]');
            const submitBtn = commentsForm.querySelector('[data-comment-submit]');
            if (!body?.value.trim()) return;
            const postId = document.querySelector('[data-comments-section]')?.getAttribute('data-post-id');
            if (!postId) return;

            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Mengirim…'; }
            try {
                const res = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrfToken() },
                    body: JSON.stringify({ type: 'blog', id: Number(postId), parent_id: replyParentId, body: body.value.trim() }),
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data?.message || 'Gagal mengirim komentar.');
                    return;
                }
                body.value = '';
                replyParentId = null;
                if (replyContext) replyContext.hidden = true;
                body.placeholder = 'Tulis komentar Anda…';
                if (commentsCountEl) commentsCountEl.textContent = (Number(commentsCountEl.textContent) || 0) + 1;
                loadComments();
            } catch (err) {
                alert('Gagal mengirim komentar. Coba lagi.');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kirim Komentar'; }
            }
        });
    }

    document.querySelectorAll('[data-scroll-comments]').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelector('[data-comments-section]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}
