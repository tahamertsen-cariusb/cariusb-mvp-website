# Auth + Dashboard + Studio (Prod) Playbook

Bu doküman, projede yaşanan “Dashboard açılınca hiçbir Supabase isteği gitmiyor / her şey foto yükleyince düzeliyor” sınıfı hataları bir daha yaşamamak için uygulanan prod-grade yaklaşımı ve operasyonel kontrol listesini içerir.

## 0) Problem Sınıfı (Belirti → Kök Neden)

**Belirtiler**
- `/dashboard` ilk açılışta projeler gelmiyor, Network’te Supabase çağrısı görünmüyor.
- Krediler görünmüyor; Studio’da foto yükleyince hem krediler hem projeler bir anda görünmeye başlıyor.
- Sayfayı yenileyince bazen oluyor bazen olmuyor.

**Tipik kök neden**
- “Logged in” kararı **Zustand persist** üzerinden veriliyor ama **Supabase session/cookie** henüz hazır değil (veya yok).
- Client-side gate (useEffect redirect/fetch) ilk render’daki race condition’lara çok açık.
- “Foto upload” akışındaki `supabase.auth.getUser()` gibi çağrılar session’ı hydrate ettiği için “yan etkisel” olarak sistemi düzeltiyor.

Bu dokümanın hedefi: Auth’ı tek otoriteye bağlayıp (Supabase session) sayfaları deterministik hale getirmek.

## 1) Altın Kural: Tek Otorite Supabase Session

- “Kullanıcı giriş yaptı mı?” sorusunun cevabı **Supabase session**’dır.
- Zustand store (`useAuthStore`) UI için cache olabilir ama **source of truth değildir**.
- “Store true ama Supabase session yok” durumu mümkündür ve prodda mutlaka yönetilmelidir.

## 2) Sayfa Gate: Server-Side Redirect

Korumalı route’lar (ör: `/dashboard`, `/design-preview`) **server tarafında** kontrol edilir:

- Server component içinde `supabase.auth.getUser()` → yoksa `redirect('/login')`.
- Middleware’de aynı kontrol ile request-level güvence.

**Neden?**
- İlk render race condition’larını ortadan kaldırır.
- “İstek bile atılmadı” gibi sessiz başarısızlıkları minimize eder.

## 3) Dashboard Mimari Şablonu (List / Create / Delete)

**Hedef**
- Dashboard açılışında projeler deterministik şekilde gelsin.
- Kart sayısı `projects.length` ile birebir kalsın.
- Create/Delete gibi mutasyonlar auth/session drift’inden etkilenmesin.

**Uygulama**
- `src/app/dashboard/page.tsx` (Server Component)
  - `getUser()` ile user doğrula
  - projeleri server’da çek
  - client UI’ya `initialProjects` ile hydrate et
- `src/app/dashboard/DashboardClient.tsx` (Client Component)
  - Liste refresh / create / delete için Supabase client yerine `fetch('/api/projects')`
- `src/app/api/projects/route.ts` (Server Route Handler)
  - `getUser()` ile auth
  - DB sorguları server supabase ile
  - RLS ile birlikte “sadece kendi verisi” kuralını garanti eder

**Ne kazanıyoruz?**
- İlk sayfa yükünde auth/session deterministik.
- Network’te her zaman “API route” isteği görürsün; gözlenebilirlik artar.
- Client’ta Supabase session drift olsa bile server route doğru davranışı dayatır.

## 4) Studio Mimari Şablonu (Credits + Job Akışı)

**Hedef**
- Studio açılışında krediler “foto yüklemeden önce” de doğru görünsün.
- Auth doğrulama deterministik olsun.

**Uygulama**
- `src/app/design-preview/page.tsx` (Server Component)
  - `getUser()` ile redirect gate
  - `credits` tablosundan initial kredi hesapla
  - `DesignPreviewClient`’a `initialUser`, `initialCredits` ver
- `src/app/design-preview/DesignPreviewClient.tsx` (Client Component)
  - mount’ta auth store’u server’dan gelen `initialUser` ile hydrate et
  - `userCredits` state’i `initialCredits` ile başlar (flash/0 kredi problemini azaltır)

> Not: Kredi düşme/harcama gibi işlemler idealde RPC/transaction ile server-side yapılmalıdır.

## 5) DB / RLS “Olmazsa Olmaz” Seti

**A) RLS politikasının özü**
- `SELECT/UPDATE/DELETE`: `using (auth.uid() = user_id)`
- `INSERT`: `with check (auth.uid() = user_id)`

**B) user_id default**
- Client tarafında `user_id` set etmek zorunda kalmamak için:
  - `alter table public.projects alter column user_id set default auth.uid();`

**C) unique kapsamı**
- `project_id` “kullanıcı başına unique” olmalıysa:
  - `unique (user_id, project_id)`
  - global unique index çakışma riskini artırır.

## 6) Debug Playbook (10 Dakikada Kök Neden)

### 6.1 Network’te hiç istek yoksa
1) Sayfa server-side gate var mı?
2) Middleware redirect çalışıyor mu?
3) `/api/projects` çağrısı gidiyor mu?
4) Console’da env hatası var mı? (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

> Eğer Network’te “hiç” istek yoksa, sorun genelde RLS değil; auth/session veya sayfa akışı.

### 6.2 İstek var ama 401/403 ise
- **401**: session yok/expired → login yönlendir.
- **403** (RLS): user_id eşleşmiyor veya policy eksik.
  - DB’de row `user_id` doğru mu?
  - policy `auth.uid() = user_id` var mı?

### 6.3 “Foto yükleyince düzeliyor” görüyorsan
Bu bir alarmdır:
- Studio/Upload içinde `auth.getUser()` çağrısı session’ı hydrate ediyor olabilir.
- Çözüm: sayfayı “warmup” ile yamamak değil; server-side gate + server hydrate.

### 6.4 Tarayıcı konsolundaki `content-script.js` hataları
`Could not establish connection. Receiving end does not exist.` gibi hatalar çoğunlukla extension kaynaklıdır; app bug’ı değildir.

## 7) Yapılması / Yapılmaması Gerekenler

**Yap**
- Korumalı sayfalarda server-side `getUser()` + `redirect`.
- İlk veri (projects/credits) server’dan hydrate.
- Mutasyonları API route/RPC üzerinden yap.
- DB’de RLS + `user_id default auth.uid()`.
- “Milestone şartı”: `npm -C cari-nextjs run build` hatasız geçmeli.

**Yapma**
- “Auth hazır mı?”yı sadece Zustand persist ile belirleme.
- “Sürekli `getUser()` atarak düzeltelim” (rate/latency maliyeti ve deterministik değil).
- RLS’yi prod’da teşhis için kapatma (staging’de bile önce 401/403 ayrımını yap).

## 8) Operasyonel Checklist (PR/Merge Öncesi)

- [ ] `/dashboard` cold start: projeler geliyor mu?
- [ ] `/design-preview` cold start: kredi görünüyor mu?
- [ ] `/api/projects` GET/POST/DELETE 401 durumda login’e yönlendiriyor mu?
- [ ] RLS açıkken “başkasının row’u” görünmüyor mu?
- [ ] `npm -C cari-nextjs run build` geçiyor mu?

## 9) Dosya Haritası (Bu Milestone)

- Dashboard
  - `src/app/dashboard/page.tsx` (server gate + initial projects)
  - `src/app/dashboard/DashboardClient.tsx` (UI + API calls)
  - `src/app/api/projects/route.ts` (server auth + DB)
- Studio
  - `src/app/design-preview/page.tsx` (server gate + initial credits)
  - `src/app/design-preview/DesignPreviewClient.tsx` (client UI)
- Auth/middleware
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/middleware.ts`

