<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\BlogCategoryController;
use App\Http\Controllers\Api\BookingApiController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\BlogTagController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectMediaController;
use App\Http\Controllers\Api\ProjectShareController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\StatController;
use App\Http\Controllers\Api\RecycleBinController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\EngagementController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PushController;
use App\Http\Controllers\Api\SubscriberController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TeamMemberController;
use App\Http\Controllers\Api\AnalyticsController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('api.throttle:auth.login');
    Route::post('/register', [AuthController::class, 'register'])->middleware('api.throttle:auth.register');
    Route::post('/send-otp', [AuthController::class, 'sendOtp'])->middleware('api.throttle:otp.send');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('api.throttle:otp.verify');
    Route::get('/whatsapp-status', [AuthController::class, 'whatsappStatus']);
    Route::post('/forgot', [AuthController::class, 'forgot'])->middleware('api.throttle:auth.forgot');
    Route::post('/forgot/verify', [AuthController::class, 'verifyForgotOtp'])->middleware('api.throttle:otp.verify');
    Route::post('/subscribe', [AuthController::class, 'subscribe'])->middleware('api.throttle:subscribe.send');
    Route::post('/subscribe/verify', [AuthController::class, 'subscribeVerify'])->middleware('api.throttle:subscribe.verify');
    Route::post('/register-otp', [AuthController::class, 'registerOtp'])->middleware('api.throttle:subscribe.send');
    Route::post('/register-otp/verify', [AuthController::class, 'registerOtpVerify'])->middleware('api.throttle:subscribe.verify');
     Route::post('/set-password', [AuthController::class, 'setPassword']);
     Route::post('/reset-password', [AuthController::class, 'resetPassword']);
     Route::post('/access-link/{token}', [AuthController::class, 'consumeAccessLink'])->middleware('api.throttle:otp.verify');
    Route::post('/analytics/consent', [AnalyticsController::class, 'consent'])->middleware('api.throttle:analytics.consent');
    Route::get('/comments/{type}/{id}', [EngagementController::class, 'comments'])->where(['type' => 'blog|portfolio|package']);
});

Route::post('/webhook/tripay', [PaymentController::class, 'webhook']);

Route::middleware(['web', 'auth:sanctum', 'maintenance'])->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/unread-count', [DashboardController::class, 'unreadCount']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications', [NotificationController::class, 'clearAll']);

    // Web Push subscriptions
    Route::get('/push/vapid-key', [PushController::class, 'vapidPublicKey']);
    Route::post('/push/subscribe', [PushController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [PushController::class, 'unsubscribe']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/cover', [ProfileController::class, 'uploadCover']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);
    Route::get('/username-check', [ProfileController::class, 'checkUsername']);

    Route::middleware('permission:submit-reviews')->group(function () {
        Route::get('/reviews/my', [ReviewController::class, 'myReview']);
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/my', [ReviewController::class, 'updateMyReview']);
    });

    Route::middleware('permission:view-projects')->group(function () {
        Route::get('/projects', [ProjectController::class, 'index']);
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->withTrashed();
        Route::post('/projects/{project}/updates', [ProjectController::class, 'addUpdate']);
        Route::get('/files/{file}/download', [ProjectMediaController::class, 'downloadFile'])->name('api.file.download');
        Route::get('/projects/{project}/download-zip', [ProjectMediaController::class, 'downloadZip'])->name('api.project.download-zip')->withTrashed();
        Route::get('/projects/{project}/download-status', [ProjectMediaController::class, 'downloadStatus'])->withTrashed();
        Route::post('/projects/{project}/payments', [PaymentController::class, 'store']);
        Route::post('/projects/{project}/payments/gateway', [PaymentController::class, 'createGateway']);
        Route::get('/payments/{payment}/gateway-status', [PaymentController::class, 'gatewayStatus']);
        Route::post('/projects/{project}/redelivery-requests', [ProjectShareController::class, 'storeRedeliveryRequest']);
    });

    Route::get('/customer/dashboard', [CustomerController::class, 'dashboard']);
    Route::get('/customer/packages', [CustomerController::class, 'packages']);
    Route::get('/customer/services', [CustomerController::class, 'services']);
    Route::get('/customer/bookings', [CustomerController::class, 'bookings']);
    Route::post('/customer/bookings', [CustomerController::class, 'storeBooking'])->middleware('api.throttle:booking.create');
    Route::post('/customer/bookings/{booking}/cancel', [CustomerController::class, 'cancelBooking'])->middleware('api.throttle:booking.update');
    Route::get('/customer/invoices', [CustomerController::class, 'invoices']);
    Route::get('/customer/payments', [CustomerController::class, 'payments']);
    Route::get('/customer/payment-methods', [PaymentController::class, 'methods']);
    Route::get('/customer/gallery', [CustomerController::class, 'gallery']);
    Route::get('/customer/messages', [CustomerController::class, 'messages']);
    Route::post('/customer/messages', [CustomerController::class, 'sendMessage']);
    Route::delete('/customer/messages/{message}', [CustomerController::class, 'deleteMessage']);

    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/bookmarks', [BookmarkController::class, 'store']);
    Route::delete('/bookmarks/{type}/{id}', [BookmarkController::class, 'destroy'])->where(['type' => 'blog|portfolio|package']);

    Route::post('/likes/toggle', [EngagementController::class, 'toggleLike']);
    Route::post('/comments', [EngagementController::class, 'storeComment']);
    Route::delete('/comments/{comment}', [EngagementController::class, 'destroyComment']);

    Route::middleware('role:owner|admin')->group(function () {
        Route::get('/comments/moderate/list', [EngagementController::class, 'moderateList']);
        Route::patch('/comments/{comment}/moderate', [EngagementController::class, 'moderate']);
    });

    Route::apiResource('categories', \App\Http\Controllers\Api\CategoryController::class)->names('api.categories')->except(['create', 'edit']);

    Route::get('/history', [HistoryController::class, 'index']);

    Route::middleware('role:owner|admin')->group(function () {
        Route::get('/subscribers', [SubscriberController::class, 'index']);
        Route::get('/subscribers/trashed', [SubscriberController::class, 'trashed']);
        Route::get('/subscribers/{user}', [SubscriberController::class, 'show']);
        Route::post('/subscribers/{user}/disable', [SubscriberController::class, 'disable']);
        Route::post('/subscribers/{user}/activate', [SubscriberController::class, 'activate']);
        Route::post('/subscribers/{user}/resend-activation', [SubscriberController::class, 'resendActivation']);
        Route::post('/subscribers/{user}/soft-delete', [SubscriberController::class, 'softDelete']);
        Route::post('/subscribers/{user}/restore', [SubscriberController::class, 'restore']);
        Route::delete('/subscribers/{user}/force-delete', [SubscriberController::class, 'forceDelete']);

        Route::get('/audit', [AuditLogController::class, 'index']);
        Route::get('/audit/actions', [AuditLogController::class, 'actions']);
        Route::get('/audit/login-history', [AuditLogController::class, 'loginHistory']);
        Route::get('/audit/online-users', [AuditLogController::class, 'onlineUsers']);
        Route::get('/audit/links', [AuditLogController::class, 'links']);

        Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);
        Route::get('/analytics/visits', [AnalyticsController::class, 'visits']);
        Route::get('/analytics/accounts', [AnalyticsController::class, 'accounts']);
        Route::get('/analytics/behavior', [AnalyticsController::class, 'behavior']);
        Route::get('/analytics/raw', [AnalyticsController::class, 'raw']);
        Route::post('/analytics/rollup', [AnalyticsController::class, 'rollup']);

        Route::post('/projects', [ProjectController::class, 'store']);
        Route::put('/projects/{project}', [ProjectController::class, 'update']);
        Route::patch('/projects/{project}/status', [ProjectController::class, 'updateStatus']);
        Route::post('/projects/{project}/advance', [ProjectController::class, 'advance']);
        Route::post('/projects/{project}/files', [ProjectMediaController::class, 'uploadFile']);
        Route::post('/projects/{project}/videos', [ProjectMediaController::class, 'uploadVideo']);
        Route::delete('/files/bulk', [ProjectMediaController::class, 'deleteFiles']);
        Route::delete('/files/{file}', [ProjectMediaController::class, 'deleteFile']);
        Route::post('/projects/{project}/thumbnail', [ProjectMediaController::class, 'setThumbnail']);
        Route::patch('/projects/{project}/archive', [ProjectController::class, 'archive']);
        Route::patch('/projects/{project}/restore', [ProjectController::class, 'restore']);
        Route::patch('/projects/{project}/gallery-status', [ProjectController::class, 'setGalleryStatus']);
        Route::patch('/redeliveries/{redelivery}', [ProjectShareController::class, 'reviewRedelivery']);

        Route::get('/bookings', [BookingApiController::class, 'index']);
        Route::get('/bookings/{booking}', [BookingApiController::class, 'show']);
        Route::put('/bookings/{booking}', [BookingApiController::class, 'update']);
        Route::post('/bookings/{booking}/confirm', [BookingApiController::class, 'confirm']);
        Route::post('/bookings/{booking}/accept', [BookingApiController::class, 'accept']);
        Route::post('/bookings/{booking}/reject', [BookingApiController::class, 'reject']);
        Route::post('/bookings/{booking}/cancel', [BookingApiController::class, 'cancel']);

        Route::get('/payments', [PaymentController::class, 'index']);
        Route::patch('/payments/{payment}/confirm', [PaymentController::class, 'confirm']);
        Route::patch('/payments/{payment}/reject', [PaymentController::class, 'reject']);

        Route::get('/invoices', [App\Http\Controllers\Api\InvoiceController::class, 'index']);

        Route::apiResource('portfolios', PortfolioController::class)->except(['create', 'edit']);
        Route::delete('/media/bulk', [MediaController::class, 'bulkDestroy']);
        Route::apiResource('media', MediaController::class)
            ->parameters(['media' => 'media'])
            ->only(['index', 'store', 'update', 'destroy']);
        Route::post('/media/import', [MediaController::class, 'importFromUrl']);
        Route::apiResource('services', ServiceController::class)->except(['create', 'edit']);
        Route::apiResource('packages', PackageController::class)->except(['create', 'edit']);
        Route::apiResource('clients', ClientController::class)
            ->parameters(['clients' => 'user'])
            ->except(['create', 'edit', 'show', 'destroy']);
        Route::get('/clients/{user}/credentials', [ClientController::class, 'credentials']);
        Route::post('/clients/{user}/token/{purpose}', [ClientController::class, 'issueToken'])->whereIn('purpose', ['invite', 'recovery', 'project']);
        Route::post('/clients/{user}/disable', [ClientController::class, 'disable']);
        Route::post('/clients/{user}/activate', [ClientController::class, 'activate']);
        Route::post('/clients/{user}/soft-delete', [ClientController::class, 'softDelete']);
        Route::post('/clients/{user}/restore', [ClientController::class, 'restore']);
        Route::delete('/clients/{user}/force-delete', [ClientController::class, 'forceDelete']);
        Route::get('/clients-trashed', [ClientController::class, 'trashed']);

        Route::get('/recycle-bin', [RecycleBinController::class, 'index']);
        Route::post('/recycle-bin/{type}/{id}/restore', [RecycleBinController::class, 'restore'])->whereIn('type', ['client', 'blog', 'portfolio', 'subscriber']);
        Route::delete('/recycle-bin/{type}/{id}', [RecycleBinController::class, 'forceDelete'])->whereIn('type', ['client', 'blog', 'portfolio', 'subscriber']);

        Route::get('/messages', [MessageController::class, 'index']);
        Route::get('/messages/{message}', [MessageController::class, 'show']);
        Route::get('/messages/{message}/thread', [MessageController::class, 'thread']);
        Route::post('/messages/{message}/reply', [MessageController::class, 'reply']);
        Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
        Route::get('/messages-unread/count', [MessageController::class, 'unreadCount']);

        Route::middleware('permission:manage-reviews')->group(function () {
            Route::get('/reviews', [ReviewController::class, 'index']);
            Route::put('/reviews/{review}', [ReviewController::class, 'update']);
            Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
        });

        Route::middleware('permission:manage-blog')->group(function () {
            Route::get('/blog/counts', [BlogController::class, 'counts']);
            Route::apiResource('blog', BlogController::class)->names('api.blog')->except(['create', 'edit']);
            Route::apiResource('blog-tags', BlogTagController::class)->except(['create', 'edit']);
        });

        Route::middleware('permission:manage-faq')->group(function () {
            Route::apiResource('faqs', FaqController::class)->except(['create', 'edit']);

            Route::get('/stats/preview', [StatController::class, 'preview']);
            Route::apiResource('stats', StatController::class)->except(['create', 'edit']);
        });

        Route::middleware('permission:manage-pages')->group(function () {
            Route::get('/landing/options', [PageController::class, 'options']);
            Route::get('/pages', [PageController::class, 'index']);
            Route::get('/pages/{slug}', [PageController::class, 'show'])->where('slug', '.*');
            Route::put('/pages/{slug}', [PageController::class, 'update'])->where('slug', '.*');
        });
    });

    Route::middleware('role:owner')->group(function () {
        Route::get('/team', [TeamController::class, 'index']);
        Route::post('/team', [TeamController::class, 'store']);
        Route::put('/team/{user}', [TeamController::class, 'update']);
        Route::delete('/team/{user}', [TeamController::class, 'destroy']);
        Route::get('/team/{user}/credentials', [TeamController::class, 'credentials']);
        Route::post('/team/{user}/token/{purpose}', [TeamController::class, 'issueToken'])->whereIn('purpose', ['invite', 'recovery']);

        Route::get('/team-members', [TeamMemberController::class, 'index']);
        Route::post('/team-members', [TeamMemberController::class, 'store']);
        Route::post('/team-members/import', [TeamMemberController::class, 'import']);
        Route::put('/team-members/{member}', [TeamMemberController::class, 'update']);
        Route::delete('/team-members/{member}', [TeamMemberController::class, 'destroy']);

        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update']);
        Route::post('/settings/test-email', [SettingsController::class, 'testEmail']);
        Route::post('/settings/test-whatsapp', [SettingsController::class, 'testWhatsapp']);
        Route::post('/settings/test-webhook', [SettingsController::class, 'testWebhook']);
        Route::post('/settings/test-payment-gateway', [SettingsController::class, 'testPaymentGateway']);
    });
});
