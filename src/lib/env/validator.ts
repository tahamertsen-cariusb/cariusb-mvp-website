/**
 * Environment Variable Validator
 * 
 * Production-ready environment variable validation system.
 * Tüm gerekli environment variable'ları kontrol eder ve eksik olanları bildirir.
 */

type EnvVarConfig = {
  key: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
};

/**
 * Gerekli environment variable'ların listesi
 */
const ENV_VARS: EnvVarConfig[] = [
  // Supabase (Required)
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    errorMessage: 'Must be a valid Supabase URL (https://*.supabase.co)',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key (public)',
    validator: (value) => value.length > 20,
    errorMessage: 'Must be a valid Supabase anon key',
  },
  
  // Worker URL (Optional - has fallback default)
  {
    key: 'NEXT_PUBLIC_WORKER_URL',
    required: false,
    description: 'Cloudflare Worker URL for asset storage (has fallback)',
    validator: (value) => value.startsWith('https://'),
    errorMessage: 'Must be a valid HTTPS URL',
  },
  
  // n8n Webhooks (Optional but recommended)
  {
    key: 'N8N_STUDIO_PHOTO_WEBHOOK_URL',
    required: false,
    description: 'n8n webhook URL for photo mode',
    validator: (value) => value.startsWith('https://'),
    errorMessage: 'Must be a valid HTTPS URL',
  },
  {
    key: 'N8N_STUDIO_VIDEO_WEBHOOK_URL',
    required: false,
    description: 'n8n webhook URL for video mode',
    validator: (value) => value.startsWith('https://'),
    errorMessage: 'Must be a valid HTTPS URL',
  },
];

/**
 * Environment variable validation sonucu
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  invalid: string[];
}

/**
 * Tüm environment variable'ları doğrular
 * 
 * @param options Validation seçenekleri
 * @returns Validation sonucu
 */
export function validateEnv(
  options: {
    strict?: boolean; // Strict mode: tüm optional'ları da kontrol et
    skipValidation?: boolean; // Validator fonksiyonlarını çalıştırma
  } = {}
): ValidationResult {
  const { strict = false, skipValidation = false } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const config of ENV_VARS) {
    const value = process.env[config.key];
    
    // Required variable kontrolü
    if (config.required && !value) {
      missing.push(config.key);
      errors.push(`Missing required environment variable: ${config.key} (${config.description})`);
      continue;
    }

    // Optional variable kontrolü (strict mode'da)
    if (!config.required && strict && !value) {
      warnings.push(`Optional environment variable not set: ${config.key} (${config.description})`);
      continue;
    }

    // Value var ama boş string
    if (value === '') {
      if (config.required) {
        errors.push(`Environment variable ${config.key} is empty`);
      } else {
        warnings.push(`Environment variable ${config.key} is empty`);
      }
      continue;
    }

    // Validator kontrolü (skipValidation false ise)
    if (!skipValidation && value && config.validator) {
      if (!config.validator(value)) {
        invalid.push(config.key);
        errors.push(
          `Invalid value for ${config.key}: ${config.errorMessage || 'Validation failed'}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missing,
    invalid,
  };
}

/**
 * Belirli bir environment variable'ı doğrular
 * 
 * @param key Environment variable key'i
 * @returns Value veya undefined
 */
export function getEnvVar(key: string): string | undefined {
  return process.env[key];
}

/**
 * Belirli bir environment variable'ı alır, yoksa hata fırlatır
 * 
 * @param key Environment variable key'i
 * @param fallback Fallback değer (opsiyonel)
 * @returns Value
 * @throws Error if required and missing
 */
export function requireEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please set it in your .env.local file or Vercel environment variables.`
    );
  }
  
  return value;
}

/**
 * Production'da environment variable'ları kontrol eder
 * Development'ta sadece uyarı verir, production'da hata fırlatır
 * 
 * @throws Error in production if validation fails
 */
export function validateEnvOnStartup(): ValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const result = validateEnv({ strict: isProduction });

  if (!result.isValid) {
    const errorMessage = [
      'Environment variable validation failed:',
      ...result.errors,
      ...result.missing.map((key) => `  - Missing: ${key}`),
      ...result.invalid.map((key) => `  - Invalid: ${key}`),
    ].join('\n');

    if (isProduction) {
      throw new Error(errorMessage);
    } else {
      console.warn('⚠️ Environment variable validation warnings:');
      console.warn(errorMessage);
      if (result.warnings.length > 0) {
        console.warn('\nWarnings:');
        result.warnings.forEach((w) => console.warn(`  - ${w}`));
      }
    }
  } else if (result.warnings.length > 0 && !isProduction) {
    console.warn('⚠️ Environment variable warnings:');
    result.warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  return result;
}

/**
 * Type-safe environment variable getter
 * Lazy evaluation ile - sadece kullanıldığında değerleri alır
 */
export const env = {
  // Supabase
  get supabase() {
    return {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || '',
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '',
      serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    };
  },
  
  // Worker
  get worker() {
    return {
      url: getEnvVar('NEXT_PUBLIC_WORKER_URL') || 'https://broad-violet-3cb6.tahamertsen.workers.dev',
    };
  },
  
  // n8n
  get n8n() {
    return {
      webhookUrl: getEnvVar('N8N_WEBHOOK_URL'),
      incomingWebhookUrl: getEnvVar('N8N_INCOMING_WEBHOOK_URL'),
      secret: getEnvVar('N8N_WEBHOOK_SECRET'),
      apiKey: getEnvVar('N8N_API_KEY'),
      communityPost: {
        url: getEnvVar('N8N_COMMUNITY_POST_WEBHOOK_URL'),
        secret: getEnvVar('N8N_COMMUNITY_POST_SECRET'),
      },
      studioPhoto: {
        url: getEnvVar('N8N_STUDIO_PHOTO_WEBHOOK_URL'),
        secret: getEnvVar('N8N_STUDIO_PHOTO_SECRET'),
      },
      studioVideo: {
        url: getEnvVar('N8N_STUDIO_VIDEO_WEBHOOK_URL'),
        secret: getEnvVar('N8N_STUDIO_VIDEO_SECRET'),
      },
      projectCreated: {
        url: getEnvVar('N8N_PROJECT_CREATED_WEBHOOK_URL'),
        secret: getEnvVar('N8N_PROJECT_CREATED_SECRET'),
      },
    };
  },
  
  // Application
  get nodeEnv() {
    return getEnvVar('NODE_ENV') || 'development';
  },
  get isProduction() {
    return process.env.NODE_ENV === 'production';
  },
  get isDevelopment() {
    return process.env.NODE_ENV === 'development';
  },
};

