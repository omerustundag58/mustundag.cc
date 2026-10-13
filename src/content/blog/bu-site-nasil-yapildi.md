---
title: "Bu site nasıl yapıldı: Astro + GitHub Pages + CRT"
description: "mustundag.cc'yi sıfırdan kurdum. Astro, GitHub Actions ile otomatik yayınlama, Cloudflare DNS ve Tokyo Night temalı bir CRT arayüzü."
pubDate: 2026-10-13
tags: ["web", "astro", "ci", "notlar"]
---

Kendi sitemi yıllardır "bir gün yaparım" listesinde tutuyordum. Bu sefer
**tek sayfa, hızlı, bakımı ücretsiz** hedefiyle kurdum. İşte aldığım kararlar
ve nedenleri.

<!--truncate-->

## Neden statik?

Dinamik bir şeye ihtiyacım yok: veritabanı yok, oturum yok, form yok.
İçerik (blog yazıları, proje listesi) **derleme anında** HTML'e dönüşüyor.
Sonuç: saniyeler içinde açılan bir sayfa, sıfır sunucu bakımı.

## Yığın

| Katman | Seçim | Neden |
|---|---|---|
| Üretici | **Astro** | Sıfır JS ile çalışır, blog için content collection desteği hazır |
| Yayınlama | **GitHub Pages + Actions** | `git push` = site yayında |
| CDN/DNS | **Cloudflare** | Ücretsiz proxy, SSL, DDoS koruması |
| Tema | **El yazımı CSS** | CRT terminal estetiği, framework yok |

## Yayının otomasyonu

`.github/workflows/deploy.yml` dosyası her `push`'ta şunları yapıyor:

1. Bağımlılıkları kuruyor
2. `astro build` ile `dist/` üretiyor
3. `actions/deploy-pages` ile GitHub Pages'e yüklüyor

Kritik ayrıntı: Pages ayarını **eski (legacy) moddan Actions moduna** çevirmek
gerekiyor. Yoksa workflow başarıyla derliyor ama yayına çıkaramıyor.

```bash
gh api -X POST repos/OWNER/REPO/pages -f build_type=workflow
```

## Proje listesi nereden geliyor?

Listeyi elle tutmak yerine **derleme anında** GitHub API'sinden çekiyorum:

```ts
const res = await fetch(
  'https://api.github.com/users/omerustundag58/repos?sort=updated',
  { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } }
);
```

Actions içinde `GITHUB_TOKEN` otomatik olarak veriliyor; böylece rate limit'e
takılmıyorsun. Ağ başarısız olursa sessizce elle bakılan listeye düşüyor —
yani site **asla kırılmıyor**.

## CRT teması: üç katman

1. **Tarama çizgileri** — `repeating-linear-gradient` ile sabitlenmiş overlay
2. **Titreşim + vinyet** — hafif `opacity` animasyonu, kenarlarda karartma
3. **Yazma efekti** — JS yok; komutun uzunluğunu bilen CSS `steps()` animasyonu

```css
.tw {
  width: var(--len, 0ch);
  animation: type var(--dur) forwards;
  animation-timing-function: steps(var(--steps), end);
}
```

`prefers-reduced-motion` ayarı açık olan kullanıcılar için tüm bu efektler
kapanıyor ve içerik anında görünür hale geliyor. Erişilebilirlik, estetiğin
önüne geçer.

## Ne öğrendim

- En çok zaman alan kısım kod değil, **DNS ve yayınlama sırası** idi.
- `npm`'i PowerShell'de çalıştıramıyorsan: `cmd /c npm install`.
- Siteyi yayına almadan önce `build_type` ayarını değiştirmeyi unutma; aksi
  halde birkaç dakikalığına 404 alırsın.

Bir sonraki yazıda DPI engelinin ne olduğunu ve record-split'in neden işe
yaradığını anlatacağım.
