# NewRadioProject

Bu proje, React ve Vite kullanılarak tasarlanmış, **GitHub Pages** üzerinde ücretsiz ve kolay bir şekilde yayınlanabilen, gerçek zamanlı UTC senkronizasyonuna sahip bir internet radyosudur.
Radyo, özel bir **Global UTC Senkronizasyon algoritması** kullanarak gerçek radyo hissiyatı uyandırır. Kullanıcılar ne zaman girerse girsin, tüm dünyadaki dinleyicilerle aynı saniyede, aynı şarkıyı dinler.

## Öne Çıkan Özellikler

- **Zaman Tabanlı Senkronizasyon (UTC)**: Şarkıların toplam süresi üzerinden gün başından itibaren geçen saniyeye göre hangi şarkının çalacağı dinamik hesaplanır.
- **Modern ve Akıcı Arayüz**: Tailwind CSS ve Framer Motion ile desteklenen şık, neon etkili ve cam görünümlü (glassmorphism) tasarım.
- **Web Audio API Tabanlı Frekans Analizörü**: Müziğe göre gerçek zamanlı tepki veren animasyonlu ses dalgaları.
- **Kolay Playlist Yönetimi**: Bir JSON dosyası ile kod yazmadan radyo yayın akışını değiştirebilme.

## Yerel Ortamda Çalıştırma

Geliştirme ortamınızda (kendi bilgisayarınızda) radyoyu test etmek için şu adımları izleyin:

1. Depoyu bilgisayarınıza indirin (clone).
2. Bağımlılıkları yüklemek için terminalde proje klasöründe şu komutu çalıştırın:
   ```bash
   npm install
   ```
3. Geliştirici sunucusunu başlatın:
   ```bash
   npm run dev
   ```
4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek radyoyu dinlemeye başlayın.

## Playlist ve Müzik Yönetimi

Radyoda çalacak şarkıları değiştirmek çok basittir:
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
- Şarkı ses dosyalarınızı (`.mp3`) `/public/music/` klasörüne atın.
- Şarkı kapak fotoğraflarınızı (`.jpg`, `.png`) `/public/covers/` klasörüne atın.
- `duration` değeri **saniye** cinsinden tam uzunluk olmalıdır. Örneğin şarkı 3 dakika 20 saniye ise `duration: 200` yapmalısınız. Aksi takdirde senkronizasyon bozulur.

## GitHub Pages Üzerinde Yayınlama

Bu projeyi **tamamen ücretsiz** bir şekilde GitHub Pages'te yayınlayabilirsiniz! Projede GitHub Actions (deploy.yml) ayarları hazırdır. 
Radyonuzu hemen yayına almak için bu adımları takip edin:

1. Bu projeyi kendi GitHub hesabınıza bir depo (repository) olarak yükleyin veya push edin.
2. GitHub deponuza gidin ve sağ üstten **Settings (Ayarlar)** sekmesine tıklayın.
3. Sol menüden **Pages** kısmına girin.
4. "Build and deployment" bölümü altındaki "Source" (Kaynak) seçeneğini **GitHub Actions** olarak değiştirin.
5. Herhangi bir kod değişikliğini `main` dalına (branch) gönderdiğinizde, proje otomatik olarak derlenip yayına alınacaktır.
6. İşlem tamamlandığında aynı **Pages** sayfasında size verilen link (örneğin: `https://kullaniciadiniz.github.io/depo-ismi`) üzerinden radyonuza canlı olarak erişebilirsiniz.

*Eğer temanın, görsellerin veya müziklerin Github Pages üzerinde tam yüklenmemesi gibi bir sorun yaşarsanız:*
Proje ana dizinindeki `vite.config.ts` dosyasını açın ve `base: './',` ayarını projenizin ismine göre güncelleyin. Örneğin depo isminiz "x-radio" ise: `base: '/x-radio/',` olarak değiştirin ve kodunuzu Github'a tekrar gönderin (push).

## Kullanılan Teknolojiler

- **React 19**
- **Vite**
- **Tailwind CSS v4**
- **Framer Motion**
- **Lucide React**
