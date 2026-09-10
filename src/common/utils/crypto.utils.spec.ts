import { encryptLoanId, decryptLoanId } from './crypto.utils';

describe('CryptoUtils', () => {
  const testLoanId = 'loan-id-12345-abcde';

  it('should encrypt and decrypt a loan ID successfully', () => {
    const token = encryptLoanId(testLoanId);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    const decrypted = decryptLoanId(token);
    expect(decrypted).toBe(testLoanId);
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
