export function getPasswordStrength(password: string): 'weak' | 'moderate' | 'strong' {
  if (!password) return 'weak';
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length >= 12 && hasLetters && hasNumbers && hasSymbols) return 'strong';
  if (password.length >= 8 && hasLetters && (hasNumbers || hasSymbols)) return 'moderate';
  return 'weak';
}
