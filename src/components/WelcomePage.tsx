
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/types';
import { Sparkles } from 'lucide-react';

export function WelcomePage({ user }: { user: User }) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 overflow-hidden bg-gradient-to-tr from-primary via-sky-500 to-emerald-500 text-primary-foreground">
        <CardHeader className="text-center p-8 md:p-12">
          <div className="flex flex-col items-center gap-4">
            <Sparkles className="h-20 w-20 text-white/80 animate-pulse" />
            <CardTitle className="text-4xl md:text-5xl font-extrabold drop-shadow-lg">
              Bienvenue, {user.name} !
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-8 md:pb-12 px-4">
          <CardDescription className="text-lg md:text-xl text-white/90 max-w-md mx-auto text-center">
            Votre espace de gestion personnalisé est prêt. Utilisez le menu pour naviguer et commencer à travailler.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
