import { encryptLoanId, decryptLoanId } from './crypto.utils';

describe('CryptoUtils', () => {
  const testLoanId = 'loan-id-12345-abcde';

  it('should encrypt and decrypt a loan ID successfully', () => {
    const token = encryptLoanId(testLoanId);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    const decrypted = decryptLoanId(token);
    expect(decrypted).not.toBeNull();
    expect(decrypted?.loanId).toBe(testLoanId);
    expect(decrypted?.isExpired).toBe(false);
  });

  it('should detect an expired token', () => {
    // Expirado hace 1 hora
    const pastDate = Date.now() - 3600 * 1000;
    const token = encryptLoanId(testLoanId, pastDate);

    const decrypted = decryptLoanId(token);
    expect(decrypted).not.toBeNull();
    expect(decrypted?.loanId).toBe(testLoanId);
    expect(decrypted?.isExpired).toBe(true);
  });

  it('should return null for an invalid token', () => {
    const decrypted = decryptLoanId('this-is-not-a-valid-token');
    expect(decrypted).toBeNull();
  });

  it('should return null for a manipulated token', () => {
    const token = encryptLoanId(testLoanId);
    // Alterar el token base64url cambiando algunos caracteres
    const manipulatedToken = token.slice(0, -5) + 'XXXXX';
    
    const decrypted = decryptLoanId(manipulatedToken);
    expect(decrypted).toBeNull();
  });

  it('should handle empty token safely', () => {
    const decrypted = decryptLoanId('');
    expect(decrypted).toBeNull();
  });
});
