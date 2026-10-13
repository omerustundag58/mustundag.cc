---
title: "DPI engeli ve record-split: SNI neden ikiye bölünür?"
description: "İnternet sağlayıcılarının TLS kayıtlarındaki SNI alanını okuyup paketleri atması ne demek? Ve SNI'yi iki parçaya bölmek bunu nasıl bozar?"
pubDate: 2026-10-14
tags: ["ağ", "vpn", "dpi", "tls"]
---

**DPI (Deep Packet Inspection)**, paketlerin içine bakabilen bir kutudur.
Basit bir firewall'dan farkı: yalnızca "hangi porta gidiyor" değil,
**"hangi siteye gidiyorsun"** sorusuna da cevap verebilir.

<!--truncate-->

## SNI: elini verdiğini tutan alan

Tarayıcı bir siteye bağlanırken TLS el sıkışması yapar. Bu el sıkışmanın
içinde, hangi alan adına bağlandığını söyleyen bir alan vardır: **SNI**
(Server Name Indication).

```
ClientHello
  ...
  server_name: "engelli-site.com"   ← açık metin, ilk pakette
```

Alan adı şifreli değildir; çünkü sunucunun hangi sertifikayı göndereceğini
bilmesi gerekir. Kötü haber: DPI kutusu da bunu okuyabilir.

## Kutu ne yapar?

1. Giden ilk TLS paketini yakalar
2. `server_name` alanını okur
3. Listesindeyse: bağlantıyı **düzgünce kapatmaz**, paketleri **atır**
   veya reset gönderir

Sonuç senin açından bir timeout'tur: site "açılmıyor".

## Record-split nasıl bozar?

TLS kayıtları (record) ayrı ayrı paketlenebilir. **Record-split** tekniği,
SNI alanını **iki ayrı TLS kaydına** dağıtır:

```
1. kayıt:  "\x17\x03\x03\x00\x20  \x00\x00\x00\x0b en"   ← yarım alan adı
2. kayıt:  "\x17\x03\x03\x00\x0e  gelli-site.com"
```

- **İstemci** için bu tamamen geçerli bir TLS el sıkışmasıdır — sunucu
  birleştirilmiş hali zaten yeniden birleştiriyor.
- **DPI kutusu** için ise elinde `en` ve `gelli-site.com` parçaları vardır;
  listesindeki desenle eşleşmez.

Kutunun bunu çözmek için el sıkışmayı yeniden birleştirmesi, yani TCP
akışını baştan sona tamponlaması gerekir. Bu yavaşlatıcıdır ve her
bağlantıda tekrarlanır; çoğu implementasyon bunu yapmaz.

## Neden bazen işe yaramaz?

- Kutu **tüm akışı birleştirip yeniden ayrıştırıyorsa** (tam oturum takibi)
- Bağlantı **QUIC/HTTP3** üzerinden gidiyorsa (UDP, farklı alan)
- **Sahte DNS** zaten isteği daha önce yok ettiyse

DPI VPN'in "otomatik modu" tam olarak bunu ölçüyor: hangi siteye giderken
hangi taktiğin çalıştığını site bazında seçiyor.

> Not: Bu alan adı ve içerik **eğitim amaçlıdır**. Erişim özgürlüğü ve
> teknik anlatım dış hiçbir amacı temsil etmez.

---

Detaylı kod ve güncel taktikler için: [github.com/omerustundag58/dpi-vpn](https://github.com/omerustundag58/dpi-vpn)
