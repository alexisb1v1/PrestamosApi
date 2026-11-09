import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Vector de inicialización estándar para GCM
const TAG_LENGTH = 16; // Tag de autenticación estándar para GCM

// Clave fija histórica para retrocompatibilidad con enlaces ya compartidos por WhatsApp
const LEGACY_SECRET = 'default-super-secret-key-32-chars!';

/**
 * Obtiene la clave criptográfica activa (debe provenir de AES_SHARE_KEY en variables de entorno).
 */
function getActiveSecretKey(): Buffer {
  const secret = process.env.AES_SHARE_KEY || LEGACY_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Obtiene la lista de claves candidatas para descifrar (Key Rollover):
 * 1. Clave primaria activa (AES_SHARE_KEY)
 * 2. Clave heredada histórica (LEGACY_SECRET) solo si la primaria es distinta
 */
function getDecryptionKeys(): Buffer[] {
  const activeKey = getActiveSecretKey();
  const legacyKey = crypto.createHash('sha256').update(LEGACY_SECRET).digest();

  // Si la clave configurada es distinta a la heredada, ofrecemos ambas para no romper enlaces anteriores
  if (!activeKey.equals(legacyKey)) {
    return [activeKey, legacyKey];
  }
  return [activeKey];
}

export interface DecryptedLoanToken {
  loanId: string;
  expiresAt: number | null;
  isExpired: boolean;
}

/**
 * Cifra un ID de préstamo junto con su fecha de expiración usando AES-256-GCM y la clave activa.
 * Formato del payload: `${loanId}:${expTimestamp}`
 * Devuelve un token seguro codificado en Base64URL.
 */
export function encryptLoanId(loanId: string, expiresAt?: number | Date): string {
  const key = getActiveSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const expTimestamp =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : typeof expiresAt === 'number'
        ? expiresAt
        : Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 días por defecto si no se especifica

  const payload = `${loanId}:${expTimestamp}`;
  
  let encrypted = cipher.update(payload, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Concatenar los componentes usando un delimitador '.'
  const rawToken = `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted}`;
  
  // Convertir a Base64URL para que sea seguro en URLs
  return Buffer.from(rawToken).toString('base64url');
}

/**
 * Descifra un token de préstamo probando primero con la clave activa y luego con la heredada.
 * Retorna DecryptedLoanToken { loanId, expiresAt, isExpired } si la verificación es exitosa,
 * o null si el token es inválido o fue manipulado.
 */
export function decryptLoanId(token: string): DecryptedLoanToken | null {
  try {
    // Decodificar Base64URL a utf8
    const rawToken = Buffer.from(token, 'base64url').toString('utf8');
    const parts = rawToken.split('.');
    
    if (parts.length !== 3) {
      return null;
    }
    
    const [ivBase64, authTagBase64, cipherTextBase64] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const cipherText = Buffer.from(cipherTextBase64, 'base64');

    const candidateKeys = getDecryptionKeys();

    // Intentar descifrar con cada clave candidata (Key Rollover)
    for (const key of candidateKeys) {
      try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(cipherText, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        
        // Soporte para formato `loanId:expiresAt` y retrocompatibilidad con solo `loanId`
        if (decrypted.includes(':')) {
          const separatorIndex = decrypted.indexOf(':');
          const loanId = decrypted.substring(0, separatorIndex);
          const expStr = decrypted.substring(separatorIndex + 1);
          const expNumber = Number(expStr);
          const isExpired = !isNaN(expNumber) && Date.now() > expNumber;

          return {
            loanId,
            expiresAt: isNaN(expNumber) ? null : expNumber,
            isExpired,
          };
        }

        return {
          loanId: decrypted,
          expiresAt: null,
          isExpired: false,
        };
      } catch (innerError) {
        // Si el descifrado o authTag falló con esta clave, prueba con la siguiente
        continue;
      }
    }

    return null;
  } catch (error) {
    // Captura fallos de formato en Base64 o manipulación
    return null;
  }
}
