# NewRadioProject

<p align="justify">Proje, React ve Vite kullanılarak tasarlanmıştır. GitHub Pages üzerinde kolay şekilde yayınlanabilen, gerçek zamanlı UTC senkronizasyonuna sahip internet radyosudur. Radyo, özel bir Global UTC Senkronizasyon algoritması kullanarak gerçek radyo hissiyatı uyandırır. Kullanıcılar ne zaman girerse girsin, dünyadaki dinleyicilerle aynı saniyede, aynı şarkıyı dinler.</p>

## Yerel Ortamda Çalıştırma

Geliştirme ortamınızda (kendi bilgisayarınızda) radyoyu test etmek için şu adımları izleyin:

1. Depoyu bilgisayarınıza indirin (clone).
2. Bağımlılıkları yüklemek için terminalde proje klasöründe şu komutu çalıştırın:

   ```bash
   npm install
   ```
   
4. Geliştirici sunucusunu başlatın:

   ```bash
   npm run dev
   ```
   
6. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek radyoyu dinlemeye başlayın.

## Playlist ve Müzik Yönetimi

Radyoda çalacak şarkıları değiştirmek çok basittir.
`/public/playlist.json` dosyasını açıp aşağıdaki formata uygun olarak istediğiniz kadar şarkı ekleyebilirsiniz:

```json
[
  {
    "title": "Şarkı Adı",
    "artist": "Sanatçı",
    "cover": "covers/sarki-kapagi.jpg",
    "file": "music/sarki.mp3",
    "duration": 59
  }
]
```

**Önemli Notlar:**
- Şarkı dosyalarınızı (`.mp3`) `/public/music/` klasörüne atın.
- Şarkı kapak fotoğraflarınızı (`.jpg`, `.png`) `/public/covers/` klasörüne atın.
- Ayrıca `duration` değeri **saniye** cinsinden tam uzunluk olmalıdır. *Örneğin şarkınız 3 dakika 20 saniye ise `duration: 200` olarak revize edilmelidir.* Aksi takdirde senkronizasyon bozulur.
