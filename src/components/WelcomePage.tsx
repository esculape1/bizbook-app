
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/types';
import { Hand } from 'lucide-react';

export function WelcomePage({ user }: { user: User }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-xl text-center shadow-2xl">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <Hand className="h-16 w-16 text-primary" />
            <CardTitle className="text-4xl font-bold">
              Bienvenue, {user.name} !
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-lg">
            Ceci est votre espace de gestion. Utilisez le menu de navigation pour accéder à vos sections.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
