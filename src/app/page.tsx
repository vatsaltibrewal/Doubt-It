import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard - the auth check will happen in the dashboard layout
  redirect('/dashboard');
}