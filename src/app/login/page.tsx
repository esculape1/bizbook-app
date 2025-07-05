
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { signIn } from '../auth/actions';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Connexion en cours...' : 'Se connecter'}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>Entrez vos identifiants pour accéder à votre espace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur de connexion</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@exemple.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                required
              />
            </div>
            <LoginButton />
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start text-sm text-muted-foreground pt-4">
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                <Info className="h-4 w-4 mt-0.5 text-blue-700 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-blue-800">Comptes de démonstration</p>
                    <p>Admin: <span className="font-mono">admin@bizbook.com</span></p>
                    <p>Utilisateur: <span className="font-mono">user@bizbook.com</span></p>
                    <p>Mot de passe (pour les deux): <span className="font-mono">password</span></p>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
