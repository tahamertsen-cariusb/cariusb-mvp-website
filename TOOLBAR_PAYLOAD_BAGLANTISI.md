# Toolbar - Payload Bağlantısı

## ✅ Evet, Toolbar'a Bağlı!

Payload, toolbar'dan seçilen feature'lar ve girilen değerlere göre oluşturuluyor.

---

## 🔄 İş Akışı

### 1. Toolbar'dan Feature Seçimi
```
Kullanıcı Toolbar'dan "Paint" Tıklar
  ↓
handleToolbarItemClick('paint') çağrılır
  ↓
activeFeature = 'paint' set edilir
  ↓
FeatureTab açılır
```

### 2. Feature Değeri Girilir
```
Kullanıcı FeatureTab'de:
  - Image URL girer VEYA
  - Instruction yazar
  ↓
onSelection callback çağrılır
  ↓
featureValues.paint = { imageUrl: '...', instruction: '...' } set edilir
  ↓
hasSelection = true
```

### 3. Feature Tab Kapanır
```
handleFeatureTabClose() çağrılır
  ↓
hasSelection = true ise:
  completedFeatures.add('paint') → paint aktif olur
  ↓
Generate butonu görünür
```

### 4. Generate Butonuna Basılır
```
handleGenerate() çağrılır
  ↓
buildPhotoModePayload() çağrılır
  ↓
Payload oluşturulur:
  - modes: ['paint'] (completedFeatures'tan)
  - images.paint: featureValues.paint.imageUrl
  - instructions.paint: featureValues.paint.instruction
```

---

## 📊 State Yönetimi

### `completedFeatures` (Set<string>)
**Ne işe yarıyor?**
- Toolbar'dan hangi feature'ların seçildiğini tutar
- `modes` array'ini oluşturmak için kullanılır

**Örnek:**
```typescript
completedFeatures = Set(['paint', 'rims', 'bodykit'])
// modes = ['paint', 'rim', 'bodykit']
```

### `featureValues` (Record<string, any>)
**Ne işe yarıyor?**
- Her feature için girilen değerleri tutar
- `images` ve `instructions` objelerini oluşturmak için kullanılır

**Örnek:**
```typescript
featureValues = {
  paint: {
    imageUrl: 'https://example.com/paint.jpg',
    instruction: 'Change to midnight blue'
  },
  rims: {
    imageUrl: 'https://example.com/rims.jpg'
  },
  window: {
    tintValue: 35
  }
}
```

---

## 🔗 Payload Oluşturma

### `buildPhotoModePayload()` Fonksiyonu

```typescript
const buildPhotoModePayload = (assetUrl: string): PhotoModePayload => {
  // 1. Modes array'i oluştur (completedFeatures'tan)
  const modes: string[] = [];
  if (completedFeatures.has('paint')) modes.push('paint');
  if (completedFeatures.has('rims')) modes.push('rim');
  // ... diğer feature'lar
  
  // 2. Images objesi oluştur (featureValues'tan)
  const images = {
    paint: featureValues.paint?.imageUrl || '',
    rim: featureValues.rims?.imageUrl || '',
    // ... diğer feature'lar
  };
  
  // 3. Instructions objesi oluştur (featureValues'tan)
  const instructions = {
    paint: featureValues.paint?.instruction || '',
    tint: featureValues.window?.tintValue?.toString() || '',
    // ... diğer feature'lar
  };
  
  return {
    metadata: { ... },
    modes,        // ← completedFeatures'tan
    sourceImage: assetUrl,
    images,       // ← featureValues'tan
    instructions  // ← featureValues'tan
  };
};
```

---

## 📋 Örnek Senaryo

### Senaryo: Kullanıcı Paint ve Rims Seçiyor

**1. Toolbar'dan Paint Seçilir:**
```typescript
handleToolbarItemClick('paint')
→ activeFeature = 'paint'
→ FeatureTab açılır
```

**2. Paint Image URL Girilir:**
```typescript
onSelection(true, { imageUrl: 'https://example.com/paint.jpg' })
→ featureValues.paint = { imageUrl: 'https://example.com/paint.jpg' }
→ hasSelection = true
```

**3. Feature Tab Kapanır:**
```typescript
handleFeatureTabClose()
→ completedFeatures.add('paint')
→ Generate butonu görünür
```

**4. Toolbar'dan Rims Seçilir:**
```typescript
handleToolbarItemClick('rims')
→ activeFeature = 'rims'
→ FeatureTab açılır
```

**5. Rims Instruction Girilir:**
```typescript
onSelection(true, { instruction: 'Change to black rims' })
→ featureValues.rims = { instruction: 'Change to black rims' }
→ hasSelection = true
```

**6. Feature Tab Kapanır:**
```typescript
handleFeatureTabClose()
→ completedFeatures.add('rims')
→ Generate butonu görünür
```

**7. Generate Butonuna Basılır:**
```typescript
handleGenerate()
→ buildPhotoModePayload() çağrılır
→ Payload:
{
  modes: ['paint', 'rim'],  // ← completedFeatures'tan
  images: {
    paint: 'https://example.com/paint.jpg',  // ← featureValues'tan
    rim: '',                                  // ← imageUrl yok
    // ...
  },
  instructions: {
    paint: '',                                // ← instruction yok
    rim: 'Change to black rims',              // ← featureValues'tan
    // ...
  }
}
```

---

## ✅ Sonuç

**Evet, toolbar'a bağlı!**

- ✅ Toolbar'dan seçilen feature'lar → `modes` array'ine eklenir
- ✅ Feature'lara girilen değerler → `images` ve `instructions` objelerine eklenir
- ✅ Generate butonuna basıldığında → Tüm değerler payload'a dahil edilir

**Önemli:**
- `modes` array'i sadece `completedFeatures`'ta olan feature'ları içerir
- `images` ve `instructions` her zaman gönderilir (boş string veya değer)
- Toolbar'dan feature kaldırılırsa → `completedFeatures`'tan çıkarılır → `modes`'tan da çıkar

