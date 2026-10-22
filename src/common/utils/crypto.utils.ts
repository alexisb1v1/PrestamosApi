import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Vector de inicialización estándar para GCM
const TAG_LENGTH = 16; // Tag de autenticación estándar para GCM

function getSecretKey(): Buffer {
  const secret = process.env.AES_SHARE_KEY || 'default-super-secret-key-32-chars!';
  // Hashear el secreto para asegurar que siempre tenga exactamente 32 bytes (256 bits)
  return crypto.createHash('sha256').update(secret).digest();
}

export interface DecryptedLoanToken {
  loanId: string;
  expiresAt: number | null;
  isExpired: boolean;
}

/**
 * Cifra un ID de préstamo junto con su fecha de expiración usando AES-256-GCM.
 * Formato del payload: `${loanId}:${expTimestamp}`
 * Devuelve un token seguro codificado en Base64URL.
 */
export function encryptLoanId(loanId: string, expiresAt?: number | Date): string {
  const key = getSecretKey();
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
 * Descifra un token de préstamo.
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
    const key = getSecretKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const cipherText = Buffer.from(cipherTextBase64, 'base64');
    
    // Configurar descifrador
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
  } catch (error) {
    // Captura fallos de descifrado o manipulación de datos (ej: Bad Decrypt / Auth Tag fail)
    return null;
  }
}
