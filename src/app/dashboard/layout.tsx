'use client';

import { useAuth } from '@/app/providers';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found and not loading, redirecting to login");
      router.push('/login');
    }
  }, [user, loading, router]);
  
  // Show loading spinner while checking auth
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // If not authenticated and not loading, don't render content
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }
  
  // Only render dashboard if authenticated
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        {/* Navigation content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl text-black font-bold">DoubtIt</Link>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/dashboard/conversations" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Conversations
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-4 text-black">Logged in as {user.email}</div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="py-10">
        {children}
      </div>
    </div>
  );
}