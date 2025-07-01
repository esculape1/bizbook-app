
import { redirect } from 'next/navigation';

// Sign-ups are disabled in this simplified authentication system.
// Redirect any attempts to the login page.
export default function SignupPage() {
  redirect('/login');
}
