// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// export async function middleware(req: NextRequest) {
//   const res = NextResponse.next();
//   const supabase = createMiddlewareClient({ req, res });
  
//   const {
//     data: { session },
//   } = await supabase.auth.getSession();

//   // If no session and trying to access protected routes
//   if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
//     const redirectUrl = new URL('/login', req.url);
//     return NextResponse.redirect(redirectUrl);
//   }

//   // If session exists and trying to access auth routes
//   if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
//     const redirectUrl = new URL('/dashboard', req.url);
//     return NextResponse.redirect(redirectUrl);
//   }

//   return res;
// }

// Comment out all middleware code temporarily
export const config = {
  matcher: [], // Empty matcher means middleware won't run
};

