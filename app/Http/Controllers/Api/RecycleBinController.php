<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\ContactMessage;
use App\Models\Payment;
use App\Models\Portfolio;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ClientCascadeService;
use Illuminate\Http\Request;

/**
 * Recycle Bin global: daftar data soft-deleted + aksi pulihkan / hapus permanen.
 * Mendukung: klien (cascade), blog, portofolio, dan subscriber.
 */
class RecycleBinController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type', 'client');

        return match ($type) {
            'blog' => $this->blogItems(),
            'portfolio' => $this->portfolioItems(),
            'subscriber' => $this->subscriberItems(),
            default => $this->clientItems(),
        };
    }

    public function restore(Request $request, string $type, int $id)
    {
        return match ($type) {
            'blog' => $this->restoreBlog($id),
            'portfolio' => $this->restorePortfolio($id),
            'subscriber' => $this->restoreSubscriber($id),
            default => $this->restoreClient($id),
        };
    }

    public function forceDelete(Request $request, string $type, int $id)
    {
        return match ($type) {
            'blog' => $this->forceDeleteBlog($id),
            'portfolio' => $this->forceDeletePortfolio($id),
            'subscriber' => $this->forceDeleteSubscriber($id),
            default => $this->forceDeleteClient($id),
        };
    }

    private function restoreBlog(int $id)
    {
        $blog = Blog::onlyTrashed()->findOrFail($id);
        $title = $blog->title;
        $blog->restore();

        app(AuditLogger::class)->log('blog.restored', 'Artikel dipulihkan dari recycle bin: ' . $title, $blog);

        return response()->json(['ok' => true]);
    }

    private function restorePortfolio(int $id)
    {
        $portfolio = Portfolio::onlyTrashed()->findOrFail($id);
        $title = $portfolio->title;
        $portfolio->restore();

        app(AuditLogger::class)->log('portfolio.restored', 'Portofolio dipulihkan dari recycle bin: ' . $title, $portfolio);

        return response()->json(['ok' => true]);
    }

    private function forceDeleteBlog(int $id)
    {
        $blog = Blog::onlyTrashed()->findOrFail($id);
        $title = $blog->title;

        $blog->getMedia('cover')->each->forceDelete();
        $blog->getMedia('content_images')->each->forceDelete();

        app(AuditLogger::class)->log('blog.force_deleted', 'Artikel dihapus permanen dari recycle bin: ' . $title, $blog);
        $blog->forceDelete();

        return response()->json(['ok' => true]);
    }

    private function forceDeletePortfolio(int $id)
    {
        $portfolio = Portfolio::onlyTrashed()->findOrFail($id);
        $title = $portfolio->title;

        $portfolio->getMedia('cover')->each->forceDelete();

        app(AuditLogger::class)->log('portfolio.force_deleted', 'Portofolio dihapus permanen dari recycle bin: ' . $title, $portfolio);
        $portfolio->forceDelete();

        return response()->json(['ok' => true]);
    }

    private function restoreClient(int $id)
    {
        $user = User::role('client')->withTrashed()->findOrFail($id);
        $name = $user->name;
        app(ClientCascadeService::class)->restoreClient($user);

        app(AuditLogger::class)->log('recycle.restored', 'Dipulihkan dari recycle bin: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    private function forceDeleteClient(int $id)
    {
        $user = User::role('client')->withTrashed()->findOrFail($id);
        $name = $user->name;
        app(ClientCascadeService::class)->purgeClient($user);

        app(AuditLogger::class)->log('recycle.force_deleted', 'Dihapus permanen dari recycle bin: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    private function blogItems(): array
    {
        $items = Blog::onlyTrashed()->latest('deleted_at')->get();

        return [
            'data' => $items->map(fn (Blog $b) => [
                'id' => $b->id,
                'type' => 'blog',
                'name' => $b->title,
                'thumbnail_url' => $b->thumbnail_url,
                'category' => $b->categories()->first()?->name ?? '-',
                'deleted_by_name' => '-',
                'deleted_at' => $b->deleted_at,
            ]),
        ];
    }

    private function portfolioItems(): array
    {
        $items = Portfolio::onlyTrashed()->latest('deleted_at')->get();

        return [
            'data' => $items->map(fn (Portfolio $p) => [
                'id' => $p->id,
                'type' => 'portfolio',
                'name' => $p->title,
                'thumbnail_url' => $p->thumbnail_url,
                'category' => $p->categories()->first()?->name ?? '-',
                'deleted_by_name' => '-',
                'deleted_at' => $p->deleted_at,
            ]),
        ];
    }

    private function clientItems(): array
    {
        $users = User::role('client')
            ->with(['profile', 'deletedBy:id,username', 'deletedBy.profile'])
            ->onlyTrashed()
            ->latest('deleted_at')
            ->get();

        return [
            'data' => $users->map(function ($u) {
                $projectIds = $u->projects()->withTrashed()->pluck('id');

                return [
                    'id' => $u->id,
                    'type' => 'client',
                    'name' => $u->name,
                    'email' => $u->email,
                    'deleted_by_name' => $u->deleted_by_name ?? $u->deletedBy?->name ?? '-',
                    'deleted_at' => $u->deleted_at,
                    'delete_reason' => $u->delete_reason,
                    'projects_count' => $projectIds->count(),
                    'bookings_count' => $u->bookings()->count(),
                    'payments_count' => Payment::whereIn('project_id', $projectIds)->count(),
                    'messages_count' => ContactMessage::whereIn('project_id', $projectIds)->count(),
                ];
            }),
        ];
    }

    private function restoreSubscriber(int $id)
    {
        $user = User::role('subscriber')->withTrashed()->findOrFail($id);
        $name = $user->name;
        $user->restore();

        app(AuditLogger::class)->log('subscriber.restored', 'Subscriber dipulihkan dari recycle bin: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    private function forceDeleteSubscriber(int $id)
    {
        $user = User::role('subscriber')->withTrashed()->findOrFail($id);
        $name = $user->name;
        $user->forceDelete();

        app(AuditLogger::class)->log('subscriber.force_deleted', 'Subscriber dihapus permanen: ' . $name);

        return response()->json(['ok' => true]);
    }

    private function subscriberItems(): array
    {
        $users = User::role('subscriber')
            ->with(['profile', 'deletedBy:id,username', 'deletedBy.profile'])
            ->onlyTrashed()
            ->latest('deleted_at')
            ->get();

        return [
            'data' => $users->map(fn (User $u) => [
                'id' => $u->id,
                'type' => 'subscriber',
                'name' => $u->name,
                'email' => $u->email,
                'deleted_by_name' => $u->deleted_by_name ?? $u->deletedBy?->name ?? '-',
                'deleted_at' => $u->deleted_at,
                'bookmarks_count' => $u->bookmarks()->count(),
                'likes_count' => $u->likes()->count(),
                'comments_count' => $u->comments()->count(),
            ]),
        ];
    }
}