# Aurora Tower

Melduk geçici olarak devre dışı. Karakter, kıyafetleri, polen efekti ve kayıtlı kostüm tercihi korunur. Geri açmak için `game.js` içindeki `characters.melduk` tanımında `enabled:false` değerini `enabled:true` yap. Önceden Melduk seçilmişse oyun şimdilik Nova ile açılır; kayıtlı tercih silinmez.

Icy Tower'dan esinlenen, kurulum gerektirmeyen bir tırmanış oyunu. Yedi karakter, yedi ortam, momentumla zıplama, duvardan sekme, havada atılma ve giderek zorlaşan platformlar.

**Yeni harita: Neon 1986.** Giriş veya tur sonu ekranında Aurora ve 80'ler temalı Neon 1986 arasında seçim yap. Neon şehir, çizgili gün batımı, palmiyeler ve hareketli perspektif ızgara; her 100 katta değişen renklerle tırmanışa eşlik eder. Rekorlar haritaya göre ayrı saklanır.

Neon haritasındaki pembe ok işaretli pedlerden zıplamak ek yükseklik verir. Kasetler 150 puan kazandırır ve havada atılmayı yeniler. Melduk'un **Disco 86**, white'ın **Miami 86** kıyafetleri dolapta; bu kıyafetler her iki haritada da kullanılabilir.

Neon 1986'da sabit durunca karakter disko dansı yapar. Bu görsel animasyon fırtınayı durdurmaz.

**Kasetçalar:** Gönderilen Stayin' Alive kaydı `assets/audio/stayin-alive.mp3` yolunda depoya dahildir. Neon 1986 turunda varsayılan %18 sesle otomatik çalar. Ölümde 1,2 saniyede kısılır; özgün, sentezlenmiş bir arcade yenilgi sesi eşlik eder. Duraklatma müziği de durdurur. Müzik sesi efektlerden ayrı ayarlanır. Şarkı klonlama veya ZIP indirmeyle birlikte gelir; ayrıca dosya seçmek gerekmez.

Topladığın her kristal kalıcı cüzdana **1 kristal** ekler; ölümde kaybolmaz ve iki haritada ortak kullanılır. Çift puan bonusu cüzdan miktarını ikiye katlamaz. Önceki sürümlerde toplanan kristaller kaydedilmediği için geriye dönük eklenmez.

Başlangıç marketinde **10 kristale 15 saniyelik mıknatıs**, **12 kristale 20 saniyelik yaylı ayakkabı**, **20 kristale 10 katlık roket kalkışı** alabilirsin. Her üründen sonraki tur için bir adet alınabilir; ürünler bir sonraki tur başlarken otomatik tüketilir. Harita değişimi ve sayfa yenileme satın alınmış ürünleri korur. Cüzdan aynı tarayıcı ve adresin yerel kaydında tutulur; farklı cihazlara otomatik taşınmaz.

## Hemen oyna

1. Bu depoyu klonla veya **Code → Download ZIP** ile indir. ZIP indirdiysen önce dosyaları çıkar.
2. Windows'ta **OYNA.bat** dosyasına çift tıkla.
3. macOS / Linux / Windows'ta alternatif olarak **index.html** dosyasını tarayıcıyla aç.

İnternet, Node.js, `npm install` veya derleme gerekmez. `index.html` ve `game.js` aynı klasörde kalmalıdır. Tam ekran için F11 kullanabilirsin.

## Kontroller

| Tuş | Hareket |
| --- | --- |
| A / D veya ← / → | Koş |
| Space / W / ↑ | Zıpla; basılı tutunca her inişte tekrar zıpla |
| Shift | Havada atıl; platforma inince yenilenir |
| P / Esc | Duraklat / devam et |
| Enter | Başlat / yeniden oyna |

Hız kazanmak zıplama yüksekliğini artırır. Duvarın yanında yeniden zıplamaya basarak sekebilirsin. Dokunmatik ekranlarda ekran düğmeleri görünür.

## Oyun

- Daha önce inmediğin yüksek platformlara art arda inerek **sınırsız yükselen kombo** yap. Aynı veya daha alt platforma inmek komboyu bitirir.
- Sarı platformlar yaylı, mor platformlar hareketli, pembe platformlar kırılgandır.
- Her 5 kristalde 8 saniyelik mıknatıs ve çift kristal puanı kazanırsın.
- Her 25 katta bonus; her 100 katta artan zorluk. Her 10 katta geniş, sabit bir platform bulunur.
- Ortamlar: Gece Bahçesi → 100 Şafak Zirvesi → 200 Yıldız Denizi → 300 Buzul Fırtınası → 400 Kül Vadisi → 500 Zümrüt Gökler → 600 Kozmik Eşik.
- Melduk havada bal poleni bırakır. Karakterlerin fiziksel yetenekleri aynıdır.
- EbuCehil, siyah gömlek ve kabarık koyu saçla seçilebilir; havada çizgi film tarzı kaka parçaları bırakır.
- Aktif 2× veya üzeri komboda duvardan sekmek daha güçlü bir sıçrayış verir. Duvardan sekerken karakter takla atar.
- Melduk ve white için karakter seçiminde dörder kıyafet bulunur; tercihler kaydedilir.
- Nadir roketleri toplayarak yaklaşık 10 kat yüksel. Roket sırasında sağa-sola yön verebilirsin; bitince havada atılma yeniden hazır olur.

Rekor, ses tercihi ve karakter seçimi tarayıcıda saklanır. Rekorlar arkadaşlarınla otomatik paylaşılmaz. Farklı tarayıcılar veya dosya adresleri ayrı kayıt kullanabilir.

## Geliştirme ve test

Oynamak için gerekli değildir. Testler için Node.js 22 veya üzeri kullan:

```sh
node --check game.js
node verify.cjs
```

Ya da `npm test` çalıştır; paket kurulumu gerekmez. İsteğe bağlı GitHub Actions örneği `docs/github-actions-test.yml` içindedir. Otomatik test için bu dosyayı GitHub üzerinden `.github/workflows/test.yml` yoluna ekleyebilirsin.

Testler; hareketli platform taşıma ve inişlerini, 30/60/144 FPS fizik tutarlılığını, kombo, bonus, karakter, ortam geçişleri ve duraklatmayı kontrol eder. Canvas testleri çizim çağrılarını sahte bir bağlamda çalıştırır; gerçek tarayıcı performansı veya görsel doğrulama yerine geçmez.

## GitHub'a yükleme

GitHub'da boş bir depo oluştur. Bu klasörde terminal açıp aşağıdaki komutları çalıştır. Son komuttaki adresi kendi deponun adresiyle değiştir:

```sh
git init -b main
git add .
git commit -m "Add Aurora Tower game"
git remote add origin https://github.com/yyasinak/AuroraTower.git
git push -u origin main
```

Arkadaşların deponun **Code** menüsündeki adresi kullanarak klonlayabilir veya ZIP indirebilir. Depo henüz bu proje tarafından otomatik oluşturulmaz veya yayımlanmaz.

## Dosyalar

- `index.html`: arayüz ve stiller
- `game.js`: oyun, fizik, çizimler ve ses
- `OYNA.bat`: Windows başlatıcısı
- `verify.cjs`: bağımlılıksız regresyon testleri

Grafikler ve oyun efektleri kodla üretilir. Arka plan müziği depodaki MP3 dosyasından oynatılır; oyun sırasında harici hizmetten indirme yapılmaz. Referans fotoğraf bu depoya dahil değildir. Icy Tower ile resmi bir bağlantısı yoktur.

Kombo 8× ile sınırlı değildir; zincir sürdükçe 9×, 10× ve ötesine çıkar, puan da aynı çarpanı kullanır. Duvar sıçrayışının fiziksel güç artışı denge için sınırlı kalır.

Market: **14 kristale Kombo saati** (ilk 30 saniye yeni kombolar için 5 saniye süre) ve **18 kristale Kristal çantası** (ilk 25 saniye cüzdana çift kristal). EbuCehil dolabında Klasik, Bordo, Altın, Disco ve Buz kostümleri bulunur.
