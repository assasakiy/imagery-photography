# Blog Engagement: Subscriber, Bookmark, Like, Komentar

Dokumen ini menjelaskan fitur engagement blog publik: alur subscribe, role `subscriber`, bookmark, like, dan komentar (beserta moderasi). Berlaku untuk semua konten yang menggunakan trait engagement (saat ini `Blog`; `Portfolio` & `Package` sudah didukung backend).

## 1. Role Subscriber

- Role baru `subscriber` (Spatie Permission). Akun dibuat lewat alur subscribe publik atau Google OAuth (user baru).
- Dashboard subscriber murni (`subscribeNav`): **Dashboard, Bookmark, Riwayat** saja (tanpa Pesanan/Invoice).
- Subscriber **tidak** memiliki permission `view-projects` / `submit-reviews` — hanya bisa engagement konten publik (bookmark/like/komentar) dan melihat dashboard sederhananya.
- Client (registrasi formal) otomatis juga ber-role `subscriber` sehingga bisa ikut engagement.

## 2. Alur Subscribe Blog Publik

1. Guest menekan **Subscribe** (navbar / tombol konten) → modal `partials/subscribe-modal.blade.php`.
2. `POST /api/subscribe` (`AuthController::subscribe`, throttle `subscribe.send`) → buat user role `subscriber` status **pending** via `ClientRegistrationService::ensureUser(..., 'subscriber')`, kirim OTP, simpan `session(otp_{id})` & `session(subscribe_pending_{id})`. Response berisi `{message, is_new, dev_otp}` (dev_otp untuk lingkungan dev/test).
3. `POST /api/subscribe/verify` (`AuthController::subscribeVerify`, throttle `subscribe.verify`) → validasi OTP, set `status=active`, `activated_at`, assignRole `subscriber`, lalu login.
4. Registrasi formal `/register` (`AuthController::register`, throttle `auth.register`) → `createUser(..., 'client')` + password, **langsung aktif tanpa OTP**.
5. Google OAuth (`GoogleAuthController`) diperluas: user baru → subscriber aktif; user existing (client/subscriber) → login; admin tetap. Setting `google_subscriber_registration` (default `1`) mengontrol pendaftaran via Google untuk non-admin.

Catatan: `createUser()` sekarang public; internal memakai `array_unique(array_filter([...]))` agar `assignRole` tidak duplikat saat user sudah punya role.

## 3. Bookmark

- Tabel `bookmarks` (morph `bookmarkable_type/id`), trait `App\Support\Bookmarkable`.
- API: `GET /api/bookmarks`, `POST /api/bookmarks`, `DELETE /api/bookmarks/{type}/{id}` (`BookmarkController`).
- Halaman publik `landing_pages/blog/show.blade.php`: tombol "Simpan/Tersimpan" untuk subscriber/client login (`data-bookmark-toggle`); guest diarahkan ke modal subscribe.
- State awal di-serial di `BlogController::show` (`isBookmarked`).

## 4. Like

- Tabel `likes` (morph `likeable`, unique `user_id+type+id`), trait `App\Support\Likeable`.
- API: `POST /api/likes/toggle` (`EngagementController::toggleLike`) → balikan `{ok, liked, likes_count}`. Hanya `subscriber`/`client`.
- UI: tombol suka + counter (`data-like-toggle`) di `show.blade.php`; JS handler di `resources/js/app.js`.

## 5. Komentar

- Tabel `comments` (morph `commentable`, kolom `user_id`, `parent_id` untuk balasan, `body`, `status` = `approved|hidden`, `approved_at`), trait `App\Support\Commentable`.
- **Flat (satu level)**: UI publik hanya menampilkan komentar `parent_id` null; backend menyimpan balasan tapi publik tidak render bertingkat.
- API:
  - `GET /api/comments/{type}/{id}` → daftar komentar approved.
  - `POST /api/comments` (`storeComment`) → komentar approved langsung. Hanya `subscriber`/`client`.
  - `DELETE /api/comments/{comment}` (`destroyComment`) → pemilik atau `owner`/`admin`.
  - `GET /api/comments/moderate/list` & `PATCH /api/comments/{comment}/moderate` (status `approved|hidden`) → grup `role:owner|admin`.
- UI: form komentar (`data-comment-form`), daftar (`data-comments-list`), counter (`data-comments-count`), scroll-to (`data-scroll-comments`) di `show.blade.php` + handler `resources/js/app.js`.

## 6. Middleware Akses

Semua endpoint engagement memakai guard manual `ensureCanEngage()` = user login & (role `subscriber`, `client`, `owner`, atau `admin`). Admin/owner dapat like & komentar di konten publik layaknya subscriber/client, dan juga memiliki akses moderasi. Hapus komentar diizinkan untuk pemilik komentar atau `owner`/`admin`.

## 6b. Moderasi Komentar (Dashboard Admin)

- Halaman dashboard admin `/dashboard/comments` (`resources/js/dashboard/pages/admin/Comments.jsx`) menampilkan semua komentar dari blog/portfolio/package, dengan tab filter status (Semua/Disetujui/Disembunyikan).
- Aksi: setujui (`PATCH /api/comments/{comment}/moderate` status `approved`), sembunyikan (`hidden`), atau hapus (`DELETE /api/comments/{comment}`).
- `GET /api/comments/moderate/list?status=all|approved|hidden` (paginate 20, di-serialize dengan info target `{type, id, title}` via relation `commentable`).

## 7. Skema & Migrasi

- `likes` & `comments` ditambahkan ke squash `2026_08_10_000004_squash_reviews_security.php` (fresh install).
- Untuk DB lama: tabel dibuat via migrasi sementara lalu record + file migrasi sementara dihapus (folder migrasi tetap 5 squash, status `migrate:status` 5/5 Ran).