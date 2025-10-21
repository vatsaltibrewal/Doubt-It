import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC = ['/', '/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.includes(pathname) || pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  const accessToken = req.cookies.get('ACCESS_TOKEN')?.value
  if (!accessToken) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'required')
    url.searchParams.set('next', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    cache: 'no-store',
  })

  if (!res.ok) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'required')
    url.searchParams.set('next', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|images|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)).*)'],
}
