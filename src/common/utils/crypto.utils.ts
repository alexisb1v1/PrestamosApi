import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Vector de inicialización estándar para GCM
const TAG_LENGTH = 16; // Tag de autenticación estándar para GCM

function getSecretKey(): Buffer {
  const secret = process.env.AES_SHARE_KEY || 'default-super-secret-key-32-chars!';
  // Hashear el secreto para asegurar que siempre tenga exactamente 32 bytes (256 bits)
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra un ID de préstamo usando AES-256-GCM.
 * Devuelve un token seguro codificado en Base64URL.
 */
export function encryptLoanId(loanId: string): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(loanId, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Concatenar los componentes usando un delimitador '.'
  const rawToken = `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted}`;
  
  // Convertir a Base64URL para que sea seguro en URLs
  return Buffer.from(rawToken).toString('base64url');
}

/**
 * Descifra un token de préstamo.
 * Retorna el ID de préstamo si la verificación es exitosa, o null si el token es inválido o manipulado.
 */
export function decryptLoanId(token: string): string | null {
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
    
    return decrypted;
  } catch (error) {
    // Captura fallos de descifrado o manipulación de datos (ej: Bad Decrypt / Auth Tag fail)
    return null;
  }
}
