    # Project Context: WargaPantau (Transparency-First Complaint System)

## 1. Tech Stack Overview
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI (Aksen Biru)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Charts**: Shadcn/ui Charts (Recharts)
- **Maps**: Leaflet.js
- **Storage**: Supabase Storage (for Evidence Images)

## 2. Core Entities (Prisma Schema Logic)
- **Ticket**: id, title, description, lat, lng, status (OPEN, IN_PROGRESS, REVIEWING, CLOSED, DISPUTED), integrityScore.
- **Evidence**: ticketId, imageUrl, uploaderRole (USER/GOVERNMENT), timestamp.
- **Verification**: ticketId, userId, isSatisfied (Boolean), reasonType (BOHONG, AKAL_AKALAN, TIDAK_SESUAI), witnessComment.

## 3. Business Rules (The Workflow)
1. **Flow**: Rakyat Lapor -> Pemerintah Proses -> Pemerintah Klaim Selesai (Upload Bukti) -> Rakyat Verifikasi.
2. **The "Bohong" Trigger**: Jika Rakyat klik "Tidak/Bohong", status berubah menjadi DISPUTED. Aplikasi harus mewajibkan Rakyat mengunggah foto tandingan.
3. **Transparency**: Dashboard Statistik (Public) harus menampilkan "Integrity Rate" per departemen/instansi.
4. **Witness System**: User selain pelapor asli yang berada dalam radius 500m dari koordinat masalah dapat memberikan "Saksi Verifikasi".

## 4. UI/UX Guidelines
- Gunakan `Lucide-react` untuk icon.
- Gunakan `shadcn/ui` components: Card, Button, Badge, Dialog, Table, Tabs.
- Tema: Light mode dengan Primary Color Blue-600.
- Responsivitas: Mobile-first karena rakyat melapor via Smartphone.

## 5. Development Instructions
- Selalu gunakan Server Actions untuk mutasi data.
- Implementasikan Zod untuk validasi input form.
- Pastikan setiap perubahan status tercatat dalam tabel history/log.