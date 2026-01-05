# AUTH SCOPE LOCK (DEĞİŞTİRİLEMEZ)

## Framework
- Next.js 14.2.18
- App Router
- Runtime: Node.js
- Edge Runtime: KULLANILMAYACAK
- Middleware: KULLANILMAYACAK

## Proje Durumu
- Projede mevcut bir UI / tasarım vardır
- Auth ve backend sadece mock seviyesindedir
- Gerçek auth henüz bağlı değildir

## Auth Sistemi
- Provider: Supabase Auth
- Auth yöntemleri:
  - Email / Password
  - Google OAuth
- Magic link: YOK
- Diğer OAuth provider’lar: YOK

## Mimari Kurallar
- Server-side auth esastır
- En az 1 adet server-protected page zorunludur
- Client-side guard güvenlik için kullanılmaz
- SSR auth cookie erişimi yalnızca cookies() ile yapılır
- Header fallback KULLANILMAZ

## Güvenlik
- Supabase service role key ASLA client’a gitmez
- Client sadece anon key kullanır
- Authorization (role / permission) bu scope’un DIŞINDADIR

## Süreç
- Katmanlı auth kurulumu uygulanacaktır
- Katman atlanamaz
- Audit FAIL kabul edilmez
- Bu doküman oluşturulduktan sonra scope değiştirilemez
