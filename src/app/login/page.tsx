import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion désactivée</CardTitle>
          <CardDescription>
            L'authentification a été temporairement désactivée pour faciliter le développement.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Link href="/" className="underline text-sm">
              Accéder directement au tableau de bord
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
