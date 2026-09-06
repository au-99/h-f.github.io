# Undangan Perkahwinan Hana & Fiqri

Laman e-undangan berbahasa Melayu untuk GitHub Pages, dengan dua pengalaman undangan:

- **Keluarga:** memaparkan akad nikah dan resepsi.
- **Tetamu umum:** memaparkan resepsi bermula jam 1:00 petang sahaja.

Pihak keluarga dan jenis undangan ditentukan melalui pautan. Tetamu mengisi nama, nombor telefon, kehadiran dan jumlah tetamu sendiri. Undangan keluarga menerima sehingga 10 orang, manakala undangan resepsi menerima sehingga 5 orang termasuk pengisi borang.

## 1. Sambungkan Google Sheets

1. Cipta satu Google Sheet baharu, contohnya **RSVP Hana & Fiqri**.
2. Dalam Sheet, pilih **Extensions → Apps Script**.
3. Salin semua kandungan `google-apps-script/Code.gs` ke editor Apps Script.
4. Simpan, pilih fungsi `setupSpreadsheet`, kemudian tekan **Run**. Benarkan akses apabila diminta.
5. Pilih **Deploy → New deployment → Web app**.
6. Tetapkan **Execute as: Me** dan **Who has access: Anyone**.
7. Salin URL yang berakhir dengan `/exec`.
8. Buka `config.js` dan tampal URL tersebut pada `rsvpEndpoint`.

Google Sheet akan mempunyai tab berikut:

- `RSVP` — semua respons.
- `Ringkasan` — kiraan tetamu pihak perempuan, pihak lelaki, akad nikah dan resepsi.
- `Pihak Perempuan` — respons pihak pengantin perempuan.
- `Pihak Lelaki` — respons pihak pengantin lelaki.

Jika tetamu menghantar semula RSVP menggunakan nombor telefon dan pihak keluarga yang sama, rekod lama akan dikemas kini.

> Jangan jadikan Google Sheet itu awam. Nombor telefon tetamu ialah maklumat peribadi.

## 2. Pautan yang boleh dikongsi

Selepas diterbitkan di `https://au-99.github.io/h-f.github.io/`, gunakan pautan berikut:

- Keluarga pengantin perempuan: `?side=bride&invite=family`
- Keluarga pengantin lelaki: `?side=groom&invite=family`
- Resepsi — pihak perempuan: `?side=bride&invite=reception`
- Resepsi — pihak lelaki: `?side=groom&invite=reception`

Contoh pautan lengkap:

`https://au-99.github.io/h-f.github.io/?side=bride&invite=family`

Nama penerima boleh ditambah pada skrin pembukaan dengan `&to=Nama%20Tetamu`.

## 3. Tambah muzik

Letakkan fail MP3 berlesen dalam repositori, kemudian kemas kini `musicUrl` dalam `config.js`, contohnya `musicUrl: "wedding-instrumental.mp3"`.

## 4. Terbitkan di GitHub Pages

1. Gunakan repositori awam `au-99/h-f.github.io`.
2. Muat naik semua kandungan folder ini ke bahagian utama repositori.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih cabang `main` dan folder `/ (root)`, kemudian simpan.

Alamat laman ialah `https://au-99.github.io/h-f.github.io/` selepas penerbitan selesai.

## Jika `setupSpreadsheet` tamat masa

Pastikan anda menggunakan versi terkini `Code.gs`, kemudian pilih `setupSpreadsheet` dan tekan **Run** — bukan **Debug** atau **Restart debugger**. Versi terkini menggunakan notifikasi tidak menyekat dan selamat dijalankan semula; respons RSVP yang sudah ada tidak akan dipadam.

## Perkara pilihan untuk diganti kemudian

- `og.png` jika mahu menukar gambar pratonton perkongsian.
