// lib/auth.ts
import {jwtDecode} from 'jwt-decode';

interface JwtPayload {
  sub: string;
  role: 'user' | 'moderator' | 'admin';
  iat?: number;
  exp?: number;
}

export const getUserFromToken = (): { id: string, role: string } | null => {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded: JwtPayload = jwtDecode(token);
    return { id: decoded.sub, role: decoded.role };
  } catch (err) {
    console.warn('Invalid token:', err);
    return null;
  }
};
