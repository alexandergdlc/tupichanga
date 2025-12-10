import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    providers: [], // Added later in auth.ts to avoid edge runtime issues with bcrypt
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/admin');
            if (isOnDashboard) {
                if (isLoggedIn) {
                    // Optional: Check role if available in the session user to redirect non-owners
                    // Casting to any because the type definition might not be picked up in this context without specific TS config
                    if ((auth.user as any).role !== 'OWNER') {
                        return false; // Or redirect to home? returning false redirects to login by default.
                    }
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.picture = user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.role && session.user) {
                session.user.role = token.role;
            }
            if (token.picture && session.user) {
                session.user.image = token.picture;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
