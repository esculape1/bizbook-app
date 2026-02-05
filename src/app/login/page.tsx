'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { signIn } from '../auth/actions';
import { cn } from '@/lib/utils';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      className="w-full h-12 text-base font-black uppercase tracking-tight shadow-xl shadow-primary/20 transition-all active:scale-95" 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Authentification...
        </>
      ) : (
        'Se connecter au tableau de bord'
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, undefined);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-3xl bg-primary shadow-2xl shadow-primary/30 ring-8 ring-primary/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-primary">BizBook</h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em]">Business Management Suite</p>
          </div>
        </div>

        <Card className="border-primary/10 shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="pt-8 px-8 pb-4 text-center">
            <CardTitle className="text-2xl font-black tracking-tight">Accès Sécurisé</CardTitle>
            <CardDescription className="text-sm font-medium italic">Veuillez renseigner vos identifiants pour continuer</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            {state?.message && (
              <Alert variant="destructive" className="mb-6 rounded-2xl bg-destructive/10 animate-in fade-in zoom-in-95 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Accès refusé</AlertTitle>
                <AlertDescription className="text-xs font-medium">{state.message}</AlertDescription>
              </Alert>
            )}

            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nom@entreprise.com"
                    required
                    className="pl-11 h-12 bg-muted/30 border-primary/5 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl font-medium"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de Passe</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-11 h-12 bg-muted/30 border-primary/5 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <ShieldCheck className="size-4 text-muted-foreground/40" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              <LoginButton />
            </form>
          </CardContent>
        </Card>

        <footer className="pt-4 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center text-center gap-1.5">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">Développé par</p>
            <p className="text-sm font-black text-foreground tracking-tight">DLG Caverne Consortium</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-2">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/50 border border-primary/5 text-[11px] font-bold text-muted-foreground shadow-sm">
              <Mail className="size-3.5 text-primary" />
              <span>dlgbiomed@gmail.com</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/50 border border-primary/5 text-[11px] font-bold text-muted-foreground shadow-sm">
              <div className="flex items-center gap-1">
                <svg className="size-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.72 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.72 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div className="flex flex-col">
                <span>+226 25 46 55 12</span>
                <span className="opacity-60">+226 70 15 06 99</span>
              </div>
            </div>
          </div>
          
          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} BizBook Edition
          </p>
        </footer>
      </div>
    </div>
  );
}
