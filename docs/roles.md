# Akses owner dan pegawai

Aplikasi membaca `business_members.role` dari sesi Supabase. Role yang didukung hanya `owner` dan `pegawai`; role kosong/tidak dikenal ditolak, bukan dianggap owner. Pengguna tidak dapat memilih role sendiri saat login.

| Fitur | Owner | Pegawai |
| --- | --- | --- |
| Input pemasukan/pengeluaran dan bukti struk | Ya | Ya |
| Dashboard, saldo, riwayat seluruh transaksi | Ya | Tidak |
| Laporan, CSV, cetak | Ya | Tidak |
| Koreksi/hapus transaksi, kelola kategori/kanal | Ya | Tidak |

Pegawai dapat membaca transaksi yang dibuat oleh akunnya sendiri pada hari berjalan (WIB), berdasarkan created_at, bukan transaction_date. Tidak ada akses ke transaksi orang lain atau hari sebelumnya. Insert pegawai menggunakan respons minimal, tanpa SELECT. Tidak ada retry insert otomatis untuk mencegah duplikasi.

## Aktivasi database

Migrasi belum diterapkan ke database live. Jalankan [migrasi akses](../supabase/migrations/202611200001_owner_pegawai_access.sql) dengan administrator melalui Supabase SQL Editor setelah memeriksa skema dan membuat backup.

Prasyarat skema: ID bisnis berupa UUID, tabel/kolom sesuai service aplikasi. Periksa constraint/enum kolom `business_members.role`: bila masih membatasi nilai ke role lama, tambahkan nilai `pegawai` terlebih dahulu. Migrasi tidak mengubah role akun existing secara diam-diam. Tentukan akun yang menjadi owner dan pegawai; role lama seperti `admin` tidak memperoleh akses sampai diperbarui administrator.

Buat akun pegawai di Supabase Auth, lalu tambahkan membership pada bisnis yang sesuai dengan `role = 'pegawai'`. Owner menggunakan `role = 'owner'`. Jangan menyimpan service-role key di variabel `VITE_*`.

Migrasi mengaktifkan RLS untuk lima tabel aplikasi, menambahkan policy restrictive (membatasi policy permissive lama) dan permissive untuk akses yang diperbolehkan. Dengan migrasi lanjutan, pegawai hanya membaca inputnya sendiri hari ini dan tidak dapat mengubah/menghapus transaksi, mengubah master data, atau menaikkan role sendiri. Insert memeriksa user pencatat, keanggotaan, serta gerai/kategori aktif dalam bisnis yang sama. Pembuatan bisnis baru tetap melalui administrator karena aplikasi belum punya alur onboarding.

Audit view, RPC SECURITY DEFINER, serta policy restrictive existing di database live: view/RPC yang melewati RLS perlu dibatasi sendiri; restrictive policy lama yang lebih ketat dapat menolak akses yang seharusnya diizinkan. Migrasi ini hanya mencakup tabel yang digunakan kode aplikasi, bukan objek live yang belum tersedia di repository.

## Verifikasi setelah migrasi

Gunakan dua akun uji dan data bisnis uji:

1. Owner bisa membaca dashboard, laporan, ekspor/cetak, dan mengelola transaksi.
2. Pegawai bisa mengirim pemasukan/pengeluaran dengan respons minimal dan melihat konfirmasi sukses.
3. SELECT langsung ke financial_transactions sebagai pegawai hanya menghasilkan input miliknya hari ini (WIB); UPDATE/DELETE tidak memodifikasi baris.
4. INSERT dengan created_by berbeda, bisnis lain, outlet/kategori bisnis lain ditolak.
5. Pegawai tidak dapat UPDATE business_members untuk mengganti role menjadi owner.
6. Role tidak dikenal/kosong menampilkan penolakan akses tanpa memuat transaksi.
7. Setelah logout dan login akun lain, data sesi sebelumnya tidak muncul.

Pemeriksaan browser dengan respons API simulasi memvalidasi UI, bukan bukti bahwa RLS live sudah terpasang. Uji database di atas wajib dilakukan sebelum menganggap pembatasan API aktif.

## Hasil verifikasi lokal

Build produksi berhasil. Lint `src` lulus dengan satu warning import tidak terpakai yang sudah ada. Preview pegawai diperiksa pada 320/390/768/1280 px tanpa overflow horizontal. Simulasi simpan gagal mempertahankan nominal, lalu simpan berhasil menutup modal dan menampilkan konfirmasi; tepat satu insert per percobaan. Kontrol pengelolaan kategori tersembunyi. Tidak ada transaksi uji yang dikirim ke database live.

## Aktivasi riwayat pegawai hari ini

Setelah migrasi pertama, jalankan [migrasi riwayat](../supabase/migrations/202611200002_employee_today_history.sql) di SQL Editor. Migrasi kedua belum diterapkan ke server oleh agen. Jangan menjalankan ulang migrasi pertama setelah migrasi kedua tanpa menerapkan kembali migrasi kedua.

Riwayat dibatasi created_by = auth.uid() dan created_at dalam rentang 00:00 sampai sebelum 00:00 hari berikutnya di Asia/Jakarta. Owner tetap memiliki akses penuh. UI menampilkan 20 baris per halaman, diperbarui setelah simpan, saat kembali ke tab, dan pada pergantian hari. Riwayat gagal dimuat tidak mengubah status transaksi yang sudah berhasil tersimpan.

Uji dengan dua pegawai: A hanya melihat input A hari ini; input B dan input A kemarin tidak tampil, termasuk melalui API langsung. Input hari ini dengan tanggal transaksi kemarin tetap tampil karena batas menggunakan waktu pencatatan. Pada pergantian hari, riwayat lama hilang. Uji pula owner, pagination lebih dari 20 baris, serta kegagalan jaringan.
