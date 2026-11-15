/**
 * SIPAB Cybersecurity Password Policy Engine
 * Enforces NIST SP 800-63B / OWASP Authentication guidelines:
 * - Minimum 10 characters length
 * - Mandatory uppercase letter, lowercase letter, and number
 * - Blacklist of 100+ most common / leaked passwords
 * - Rejection of passwords containing the user's username
 */

export const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'password1234', '123456', '12345678', '123456789',
  '1234567890', '12345', 'qwerty', 'qwertyuiop', 'admin', 'adminpassword',
  'administrator', 'iloveyou', 'sunshine', 'princess', 'football', 'monkey', 'shadow',
  'master', 'dragon', 'baseball', 'superman', 'trustno1', 'welcome', 'welcome1',
  'welcome123', 'charlie', 'donald', 'mustang', 'starwars', 'killer', 'chelsea',
  'arsenal', 'liverpool', 'barcelona', 'realmadrid', 'bismillah', 'indonesia',
  'rahasia', 'rahasia123', 'merdeka', 'merdeka123', 'jakarta', 'bandung', 'surabaya',
  'default', 'default123', 'system', 'root', 'toor', 'pass123', 'pass1234', 'p@ssword',
  'p@ssw0rd', 'login', 'login123', 'changeme', 'changeme123', 'guest', 'guest123',
  'testing', 'test123', 'test1234', 'secret', 'secret123', 'bengkel', 'bengkel123',
  'adminbengkel', 'tkrbengkel', 'ototkr123', '111111', '000000',
  '123123', '654321', '666666', '777777', '888888', '999999', '12344321', 'abc123',
  'abcdef', 'abcdefg', 'qwerty123', 'asdfgh', 'zxcvbnm', 'hunter2', 'matrix',
  'jordan', 'whatever', 'freedom', 'computer', 'server123', 'network123', 'access123',
  'secure123', 'letmein', 'letmein123', 'coffee', 'cookie', 'forever', 'hacker'
]);

/**
 * Validates a password against cybersecurity rules
 * @param {string} password - The password to evaluate
 * @param {string} [username=''] - The associated username (to prevent username embedding)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePasswordPolicy(password, username = '') {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password wajib diisi.' };
  }

  // 1. Minimum 10 characters
  if (password.length < 10) {
    return {
      valid: false,
      message: 'Password minimal 10 karakter, harus mengandung huruf besar, huruf kecil, dan angka.'
    };
  }

  // 2. Character composition: at least 1 uppercase, 1 lowercase, 1 digit
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit) {
    return {
      valid: false,
      message: 'Password harus mengandung kombinasi huruf besar, huruf kecil, dan angka.'
    };
  }

  // 3. Blacklist of common passwords (case-insensitive)
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowerPassword)) {
    return {
      valid: false,
      message: 'Password terlalu umum dan mudah ditebak. Silakan gunakan kombinasi kata sandi yang lebih aman.'
    };
  }

  // 4. Disallow username inclusion (minimum 3 characters check to avoid false positives)
  if (username && typeof username === 'string') {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length >= 3 && lowerPassword.includes(cleanUsername)) {
      return {
        valid: false,
        message: 'Password tidak boleh memuat nama pengguna (username).'
      };
    }
  }

  return { valid: true };
}

export default {
  validatePasswordPolicy,
  COMMON_PASSWORDS
};
