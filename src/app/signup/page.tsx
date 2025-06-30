
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { completeSignUp } from '../auth/actions';
import { useTransition, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { auth as firebaseAuth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const signUpSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  email: z.string().email({ message: 'Adresse email invalide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    setError(null);
    startTransition(async () => {
       if (!firebaseAuth) {
        setError("La configuration de Firebase est manquante sur le client. Impossible de s'inscrire.");
        return;
      }
      try {
        // Étape 1: Créer l'utilisateur avec l'authentification Firebase côté client.
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
        
        // Étape 2: Appeler l'action serveur pour créer le document Firestore.
        const result = await completeSignUp({
          uid: userCredential.user.uid,
          email: data.email,
          name: data.name,
        });

        // Si l'action serveur renvoie une erreur, l'afficher.
        if (result?.error) {
            setError(result.error);
        }
        // En cas de succès, l'action serveur redirige, donc il n'y a rien d'autre à faire ici.

      } catch (authError: any) {
        // Gérer les erreurs de création de compte spécifiques à Firebase Auth.
        if (authError.code === 'auth/email-already-in-use') {
          setError('Cette adresse email est déjà utilisée par un autre compte.');
        } else if (authError.code === 'auth/weak-password') {
          setError('Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.');
        } else {
          setError("Une erreur inattendue est survenue lors de la création de votre compte.");
          console.error("Erreur Firebase Auth:", authError);
        }
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>Rejoignez BizBook pour gérer votre entreprise.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur d'inscription</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Création en cours...' : 'Créer le compte'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
