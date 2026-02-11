'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, User, Building2, Mail, Lock, KeyRound } from 'lucide-react';
import { signUp } from '../auth/actions';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      className="w-full h-11 text-sm font-black uppercase tracking-tight shadow-lg shadow-primary/20 transition-all active:scale-95" 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {'Creation en cours...'}
        </>
      ) : (
        'Creer mon compte'
      )}
    </Button>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const [state, formAction] = useActionState(signUp, undefined);

  const isInvite = !!inviteToken;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-x-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none select-none" />

      <div className="w-full max-w-[420px] z-10 space-y-5">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-2.5 rounded-2xl bg-primary shadow-xl shadow-primary/20 ring-4 ring-primary/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 a4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter text-primary leading-none">BizBook</h1>
            <p className="text-muted-foreground font-bold uppercase text-[8px] tracking-[0.3em] mt-1">Management Suite</p>
          </div>
        </div>

        <Card className="border-primary/10 shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-xl rounded-[1.5rem] overflow-hidden">
          <CardHeader className="pt-5 px-6 pb-0 text-center space-y-0">
            <CardTitle className="text-lg font-black tracking-tight">
              {isInvite ? 'Rejoindre une equipe' : 'Nouveau Compte'}
            </CardTitle>
            <CardDescription className="text-[10px] font-medium italic">
              {isInvite
                ? 'Vous avez ete invite a rejoindre une organisation'
                : 'Entrez votre code de licence pour commencer'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-3">
            {state?.message && (
              <Alert
                variant={state.message.startsWith('Lien') ? 'default' : 'destructive'}
                className="mb-4 py-2 rounded-xl bg-destructive/10 animate-in fade-in zoom-in-95 duration-300"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-[10px] font-medium">{state.message}</AlertDescription>
              </Alert>
            )}

            <form action={formAction} className="space-y-3">
              {inviteToken && (
                <input type="hidden" name="inviteToken" value={inviteToken} />
              )}

              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Nom complet
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    required
                    className="pl-10 h-10 bg-muted/20 border-primary/5 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl text-sm"
                  />
                </div>
              </div>

              {!isInvite && (
                <div className="space-y-1">
                  <Label htmlFor="companyName" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Nom de l{"'"}entreprise
                  </Label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="Ma Societe SARL"
                      required={!isInvite}
                      className="pl-10 h-10 bg-muted/20 border-primary/5 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nom@entreprise.com"
                    required
                    className="pl-10 h-10 bg-muted/20 border-primary/5 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 6 caracteres"
                    required
                    minLength={6}
                    className="pl-10 h-10 bg-muted/20 border-primary/5 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl text-sm"
                  />
                </div>
              </div>

              {!isInvite && (
                <div className="space-y-1">
                  <Label htmlFor="licenseCode" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Code de licence
                  </Label>
                  <div className="relative group">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="licenseCode"
                      name="licenseCode"
                      type="text"
                      placeholder="BIZBOOK-2026-XXXX"
                      required={!isInvite}
                      className="pl-10 h-10 bg-muted/20 border-primary/5 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl text-sm font-mono"
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground ml-1 mt-0.5">
                    {'Contactez-nous pour obtenir un code de licence'}
                  </p>
                </div>
              )}

              <div className="pt-1">
                <SubmitButton />
              </div>
            </form>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-xs font-bold text-primary hover:underline">
                {'Deja un compte ? Se connecter'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
