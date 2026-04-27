import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Only run security checks on /admin/leagues routes
  if (pathname.startsWith('/admin/leagues/')) {
    
    // 2. Decrypt the NextAuth token securely
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Global Admins bypass all league-specific restrictions
    if (token.isGlobalAdmin) {
        return NextResponse.next();
    }

    // 3. Extract the leagueId from the URL (e.g. /admin/leagues/3/seasons/11/play)
    const urlParts = pathname.split('/');
    const leagueIdIndex = urlParts.indexOf('leagues') + 1;
    const leagueId = parseInt(urlParts[leagueIdIndex]);

    if (!isNaN(leagueId)) {
        // 4. Find the user's membership for THIS specific league
        const memberships = token.memberships as any[] || [];
        const activeMembership = memberships.find(m => m.leagueId === leagueId);

        // If they aren't in the league at all, or haven't been approved, kick them to the dashboard
        if (!activeMembership || !activeMembership.isApproved) {
            return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        }

        // ⚡ 5. THE LEVEL 1 SCOREKEEPER LOCKDOWN
        if (activeMembership.roleLevel === 1) {
            
            // This Regex strictly allows ONLY:
            // 1. The base League Hub (so they can enter the league): /admin/leagues/[id]
            // 2. The base Season Hub (so they can select a season): /admin/leagues/[id]/seasons/[id]
            // 3. The exact 3 functional tools you requested:
            const isAllowedPath = pathname.match(/^\/admin\/leagues\/\d+(\/seasons\/\d+(\/(schedule\/new|play|manual-scores))?)?\/?$/);

            if (!isAllowedPath) {
                // If they try to access /teams, /seasons/new, /rosters, /settings, etc...
                // The Bouncer instantly kicks them back to the main admin dashboard.
                return NextResponse.redirect(new URL('/admin/dashboard', req.url));
            }
        }
    }
  }

  return NextResponse.next();
}

// ⚡ Optimize middleware to only trigger on admin league routes to save performance
export const config = {
  matcher: ['/admin/leagues/:path*'], 
};