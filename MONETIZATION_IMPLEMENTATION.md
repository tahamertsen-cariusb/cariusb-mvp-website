# Monetization Sistemi - Implementasyon Dokümantasyonu

## Genel Bakış

CARI uygulaması için kredi tabanlı monetization sistemi implement edilmiştir. Sistem, kullanıcıların render işlemleri için kredi harcaması yapmasını ve kredi bakiyelerini yönetmesini sağlar.

## Kredi Sistemi Detayları

### Çarpan
- **3581 kredi = $0.1**
- Tüm maliyetler bu çarpan üzerinden hesaplanır

### Foto Maliyetleri
- **1K/2K çözünürlük**: $0.09 = **3,223 kredi**
- **4K çözünürlük**: $0.12 = **4,297 kredi**
- **Not**: Tüm modlar (paint, rims, bodykit, vb.) birleşik tek foto üretir, bu yüzden tek maliyet

### Video Maliyetleri
- **5 saniye**: $0.21 = **7,520 kredi**
- **10 saniye**: $0.42 = **15,040 kredi**
- **Not**: Tek gidiş tek video üretir

### ROI Çarpanı
- Şu anda tüm planlar için **1.0** (değiştirilebilir)
- Gelecekte plan bazlı çarpanlar eklenecek

## Dosya Yapısı

### 1. Kredi Hesaplama (`src/lib/credits/calculator.ts`)
- `calculatePhotoCost()`: Foto maliyetini hesaplar
- `calculateVideoCost()`: Video maliyetini hesaplar
- `getROIMultiplier()`: Plan bazlı ROI çarpanını döndürür
- `dollarsToCredits()`: Doları krediye çevirir
- `creditsToDollars()`: Krediyi dolara çevirir

### 2. Kredi Bakiyesi (`src/lib/credits/balance.ts`)
- `getUserCreditBalance()`: Kullanıcının toplam kredi bakiyesini hesaplar
- `deductCredits()`: Kredi harcar (negatif kayıt ekler)
- `addCredits()`: Kredi ekler (pozitif kayıt ekler)
- `getCreditHistory()`: Kredi geçmişini getirir

## Implementasyon Detayları

### Design Preview Sayfası
- Generate butonuna tıklandığında:
  1. Kredi maliyeti hesaplanır
  2. Kullanıcının bakiyesi kontrol edilir
  3. Yetersiz kredi varsa işlem durdurulur
  4. Yeterli kredi varsa kredi düşürülür
  5. Job oluşturulur ve render başlatılır

### TopBar
- Gerçek zamanlı kredi bakiyesi gösterilir
- Design preview sayfasında `userCredits` state'inden alınır

### Billing Sayfası
- Kredi bakiyesi gösterilir
- Kredi geçmişi listelenir
- Dolar karşılığı hesaplanır

### Auth Store
- Kullanıcı giriş yaptığında kredi bakiyesi otomatik çekilir
- `useSupabaseAuth` hook'u kredi bilgisini günceller

## Supabase Yapısı

### Credits Tablosu
```sql
credits (
  id uuid,
  user_id uuid,
  amount integer,  -- Pozitif = ekleme, Negatif = harcama
  source text,     -- 'signup', 'purchase', 'deduction', vb.
  description text,
  created_at timestamp
)
```

### Kredi Hesaplama
- Tüm `amount` değerleri toplanarak toplam bakiye hesaplanır
- Pozitif değerler = eklenen krediler
- Negatif değerler = harcanan krediler

## Kullanım Örnekleri

### Foto Render İçin Kredi Hesaplama
```typescript
import { calculatePhotoCost, getROIMultiplier } from '@/lib/credits/calculator';

const userPlan = 'free';
const resolution = '4K';
const roiMultiplier = getROIMultiplier(userPlan);
const cost = calculatePhotoCost(resolution, roiMultiplier);
// Sonuç: 4297 kredi
```

### Video Render İçin Kredi Hesaplama
```typescript
import { calculateVideoCost, getROIMultiplier } from '@/lib/credits/calculator';

const userPlan = 'pro';
const duration = 10;
const roiMultiplier = getROIMultiplier(userPlan);
const cost = calculateVideoCost(duration, roiMultiplier);
// Sonuç: 15040 kredi
```

### Kredi Harcama
```typescript
import { deductCredits } from '@/lib/credits/balance';

const result = await deductCredits(
  userId,
  4297,
  'Photo generation - 4K'
);

if (result.success) {
  console.log('Yeni bakiye:', result.newBalance);
} else {
  console.error('Hata:', result.error);
}
```

## Gelecek Geliştirmeler

1. **ROI Çarpanı Yönetimi**
   - Plan bazlı çarpanlar ayarlanabilir hale getirilecek
   - Admin paneli veya Supabase tablosu üzerinden yönetilebilir

2. **Kredi Satın Alma**
   - Stripe/PayPal entegrasyonu
   - Kredi paketleri satın alma akışı

3. **Kredi İade**
   - Başarısız render işlemlerinde kredi iadesi
   - Hata durumlarında otomatik iade

4. **Kredi Uyarıları**
   - Düşük bakiye uyarıları
   - Email bildirimleri

## Test Senaryoları

1. ✅ Kredi bakiyesi kontrolü
2. ✅ Yetersiz kredi durumu
3. ✅ Foto render için kredi harcama
4. ✅ Video render için kredi harcama
5. ✅ Kredi geçmişi görüntüleme
6. ✅ TopBar'da kredi gösterimi
7. ✅ Billing sayfasında kredi gösterimi

## Notlar

- Kredi harcama işlemi job oluşturulmadan önce yapılır (pre-payment)
- Başarısız render durumlarında kredi iadesi şu anda yok (gelecek geliştirme)
- ROI çarpanı şu anda tüm planlar için 1.0, sonra ayarlanacak

