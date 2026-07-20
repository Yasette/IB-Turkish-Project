# 10 IB Türkçe — Sınıf Çalışma Sitesi

Beş eserin tema haritaları (LitCharts tarzı), anlatım teknikleri kataloğu, IO rehberi
ve düzeltmeler tablosu. Statik site — sunucu/veritabanı gerektirmez.

## Yerelde çalıştırma
Tarayıcı `fetch` kullandığı için dosyayı çift tıklayarak değil, küçük bir sunucuyla aç:
```bash
python3 -m http.server 8000
# http://localhost:8000
```
(Claude Code içinden: "siteyi yerelde çalıştır" demen yeter.)

## Yayınlama (GitHub Pages)
1. GitHub'da yeni repo aç (ör. `ib-turkce`), bu klasörü push'la.
2. Repo → Settings → Pages → Branch: `main`, klasör: `/ (root)` → Save.
3. Site `https://kullaniciadi.github.io/ib-turkce` adresinde yayınlanır.
Netlify istersen: repo'yu Netlify'a bağla, build komutu YOK, publish dir: `/`.

## İçerik nasıl güncellenir?
Tüm içerik `data/` klasöründe:
- `data/eserler.json` — eser meta bilgileri, **NotebookLM linkleri buraya**.
- `data/analiz/<eser>.json` — tema/teknik/küresel sorun girişleri.
  Yeni giriş şablonu:
  ```json
  {
    "id": "kbt-t08",
    "tip": "tema | teknik | kuresel",
    "baslik": "…",
    "yer": "Bölüm/kısım bilgisi",
    "aciklama": "Paraphrase — birebir alıntı YOK.",
    "alan": "(sadece kuresel için) araştırma alanı",
    "durum": "taslak | onaylı"
  }
  ```
- `data/teknikler.json` — 30 teknik kataloğu.
- `data/duzeltmeler.json` — hata → doğru tablosu.

Öğretmen onayından geçen girişlerde `"durum": "onaylı"` yapılır; sitede ✓ rozetiyle görünür.

## Google Sheets'e geçiş (öğretmen içerik ekleyecekse)
`js/uygulama.js` başındaki `AYAR` bloğu hazır:
1. Bir Google Sheet aç; sütunlar: `eser, tip, baslik, yer, aciklama, alan, durum`.
2. Dosya → Paylaş → Web'de yayınla → CSV linkini kopyala.
3. `AYAR.kaynak = "sheets"` ve `AYAR.sheetsCsvUrl = "…"` yap.
Site bundan sonra içerikleri tablodan okur — kod push'lamadan güncellenir.

## İlkeler
- **Birebir alıntı yayınlanmaz** — paraphrase + yer bilgisi. Alıntı gereken yerde NotebookLM.
- AI taslak girişler doğrulanmadan `onaylı` yapılmaz.
- Kitap PDF'leri bu repoya **asla** eklenmez.

## Yol haritası (Claude Code'da devam)
- [ ] NotebookLM linklerini `eserler.json`a ekle
- [ ] Öğretmenden onaylı tema listesi gelince girişleri güncelle/onayla
- [ ] Google Sheets bağlantısını aç
- [ ] Paper 1 / Paper 2 rehber sayfaları (io.html modelinde)
- [ ] Eser sayfalarına "IO'da kullanılabilecek pasaj önerileri" bölümü
