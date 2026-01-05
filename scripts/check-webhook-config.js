/**
 * Webhook Configuration Checker
 * Sistemin webhook yapılandırmasını kontrol eder
 */

const fs = require('fs');
const path = require('path');

const requiredVars = {
  communityPost: {
    url: 'N8N_COMMUNITY_POST_WEBHOOK_URL',
    secret: 'N8N_COMMUNITY_POST_SECRET',
  },
  studioPhoto: {
    url: 'N8N_STUDIO_PHOTO_WEBHOOK_URL',
    secret: 'N8N_STUDIO_PHOTO_SECRET',
  },
  studioVideo: {
    url: 'N8N_STUDIO_VIDEO_WEBHOOK_URL',
    secret: 'N8N_STUDIO_VIDEO_SECRET',
  },
};

const fallbackVars = {
  url: 'N8N_INCOMING_WEBHOOK_URL',
  secret: 'N8N_WEBHOOK_SECRET',
};

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  console.log('🔍 Webhook Yapılandırma Kontrolü\n');
  console.log('='.repeat(50));
  
  // .env.local kontrolü
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local dosyası bulunamadı!');
    console.log('\n📝 Yapılacaklar:');
    console.log('1. .env.example dosyasını kopyalayın:');
    console.log('   cp .env.example .env.local');
    console.log('2. .env.local dosyasını açın ve webhook URL\'lerini doldurun');
    console.log('3. n8n\'de webhook\'larınızı oluşturun ve URL\'leri kopyalayın\n');
    return false;
  }
  
  console.log('✅ .env.local dosyası mevcut\n');
  
  // Environment variables oku
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  // Her webhook için kontrol
  console.log('📋 Webhook Yapılandırmaları:\n');
  
  let allConfigured = true;
  
  // Community Post
  const communityConfigured = 
    envVars[requiredVars.communityPost.url] && 
    envVars[requiredVars.communityPost.secret] &&
    !envVars[requiredVars.communityPost.url].includes('your-') &&
    !envVars[requiredVars.communityPost.secret].includes('your-');
  
  console.log('Community Post Webhook:');
  console.log(`  URL: ${communityConfigured ? '✅' : '❌'} ${envVars[requiredVars.communityPost.url] || 'Yapılandırılmamış'}`);
  console.log(`  Secret: ${communityConfigured ? '✅' : '❌'} ${envVars[requiredVars.communityPost.secret] ? '***' + envVars[requiredVars.communityPost.secret].slice(-4) : 'Yapılandırılmamış'}`);
  console.log('');
  
  if (!communityConfigured) allConfigured = false;
  
  // Studio Photo
  const photoConfigured = 
    envVars[requiredVars.studioPhoto.url] && 
    envVars[requiredVars.studioPhoto.secret] &&
    !envVars[requiredVars.studioPhoto.url].includes('your-') &&
    !envVars[requiredVars.studioPhoto.secret].includes('your-');
  
  console.log('Studio Photo Mode Webhook:');
  console.log(`  URL: ${photoConfigured ? '✅' : '❌'} ${envVars[requiredVars.studioPhoto.url] || 'Yapılandırılmamış'}`);
  console.log(`  Secret: ${photoConfigured ? '✅' : '❌'} ${envVars[requiredVars.studioPhoto.secret] ? '***' + envVars[requiredVars.studioPhoto.secret].slice(-4) : 'Yapılandırılmamış'}`);
  console.log('');
  
  if (!photoConfigured) allConfigured = false;
  
  // Studio Video
  const videoConfigured = 
    envVars[requiredVars.studioVideo.url] && 
    envVars[requiredVars.studioVideo.secret] &&
    !envVars[requiredVars.studioVideo.url].includes('your-') &&
    !envVars[requiredVars.studioVideo.secret].includes('your-');
  
  console.log('Studio Video Mode Webhook:');
  console.log(`  URL: ${videoConfigured ? '✅' : '❌'} ${envVars[requiredVars.studioVideo.url] || 'Yapılandırılmamış'}`);
  console.log(`  Secret: ${videoConfigured ? '✅' : '❌'} ${envVars[requiredVars.studioVideo.secret] ? '***' + envVars[requiredVars.studioVideo.secret].slice(-4) : 'Yapılandırılmamış'}`);
  console.log('');
  
  if (!videoConfigured) allConfigured = false;
  
  // Fallback kontrolü
  const fallbackConfigured = 
    envVars[fallbackVars.url] && 
    envVars[fallbackVars.secret] &&
    !envVars[fallbackVars.url].includes('your-') &&
    !envVars[fallbackVars.secret].includes('your-');
  
  console.log('Fallback (Genel) Webhook:');
  console.log(`  URL: ${fallbackConfigured ? '✅' : '⚠️'} ${envVars[fallbackVars.url] || 'Yapılandırılmamış (opsiyonel)'}`);
  console.log(`  Secret: ${fallbackConfigured ? '✅' : '⚠️'} ${envVars[fallbackVars.secret] ? '***' + envVars[fallbackVars.secret].slice(-4) : 'Yapılandırılmamış (opsiyonel)'}`);
  console.log('');
  
  console.log('='.repeat(50));
  
  if (allConfigured) {
    console.log('\n✅ Tüm webhook\'lar yapılandırılmış! Sistem hazır.');
  } else {
    console.log('\n⚠️  Bazı webhook\'lar yapılandırılmamış.');
    console.log('\n📚 Detaylı kurulum için N8N_WEBHOOK_SETUP.md dosyasına bakın.');
  }
  
  return allConfigured;
}

// Çalıştır
checkEnvFile();

