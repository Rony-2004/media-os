export interface BetterAuthUserLike {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  role?: string | null;
  plan?: string | null;
  weeklyPostLimit?: number | null;
  isBlocked?: boolean | null;
  isActive?: boolean | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  emailVerified: boolean;
  role: string;
  plan: string;
  weeklyPostLimit: number;
  isBlocked: boolean;
  isActive: boolean;
}

export function toAuthUser(user: BetterAuthUserLike): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.image ?? null,
    emailVerified: user.emailVerified,
    role: user.role ?? 'USER',
    plan: user.plan ?? 'FREE',
    weeklyPostLimit: user.weeklyPostLimit ?? 2,
    isBlocked: user.isBlocked ?? false,
    isActive: user.isActive ?? true,
  };
}
