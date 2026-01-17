'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase-client';
import { verifyAndCreateSession } from '../auth/actions';
import 'react-international-phone/style.css';

// Using dynamic import with ssr: false is the correct approach for a client-side library
// that is not SSR-compatible. The explicit .then(mod => mod.default) tells Next.js
// how to find the component within the loaded library, fixing the error.
const InternationalPhoneInput = dynamic(() => import('react-international-phone').then(mod => mod.default), {
    ssr: false,
    loading: () => <Input placeholder="+226 XX XX XX XX" disabled className="h-[38px]"/>,
});


// This function needs to be declared to be accessible by RecaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
    grecaptcha: any;
  }
}

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // This effect sets up the reCAPTCHA verifier when the component mounts.
    try {
      if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': (response: any) => {
                  // reCAPTCHA solved, allow signInWithPhoneNumber.
              }
          });
      }
    } catch (e: any) {
        console.error("Error setting up reCAPTCHA", e);
        setError("Impossible d'initialiser le reCAPTCHA. Veuillez rafraîchir la page.");
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!phone) {
        setError("Veuillez saisir un numéro de téléphone.");
        setLoading(false);
        return;
    }
    
    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
        window.confirmationResult = confirmationResult;
        setShowOtpInput(true);
        setLoading(false);
        setError("Code envoyé ! Veuillez vérifier vos SMS.");
    } catch (err: any) {
        console.error("Erreur lors de l'envoi de l'OTP:", err);
        setError("Échec de l'envoi du code. Vérifiez le numéro ou réessayez. (" + err.code + ")");
        
        // In case of error, reset the reCAPTCHA so the user can try again.
        if (typeof window.grecaptcha !== 'undefined' && window.grecaptcha.reset && window.recaptchaVerifier) {
            window.recaptchaVerifier.render().then(widgetId => {
                window.grecaptcha.reset(widgetId);
            });
        }
        setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    if (!otp || otp.length !== 6) {
        setError("Veuillez saisir un code à 6 chiffres.");
        setLoading(false);
        return;
    }

    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
          throw new Error("La vérification a expiré. Veuillez renvoyer le code.");
      }
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // Call server action to verify token and create session
      const sessionResult = await verifyAndCreateSession(idToken);
      
      if (sessionResult.success) {
        router.push('/');
        router.refresh(); // Force a refresh to ensure session is read
      } else {
        setError(sessionResult.error || "La connexion a échoué après vérification.");
        setLoading(false);
      }

    } catch (err: any) {
        console.error("Erreur lors de la vérification de l'OTP:", err);
        setError("Code invalide ou expiré. Veuillez réessayer. (" + err.code + ")");
        setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4 pt-8">
            <div className="flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
            </div>
            <div>
                <CardTitle className="text-2xl">Bienvenue sur BizBook</CardTitle>
                <CardDescription>Connectez-vous avec votre numéro de téléphone</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="p-8">
          {error && (
              <Alert variant={error.includes("envoyé") ? "default" : "destructive"} className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{error.includes("envoyé") ? "Information" : "Erreur"}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

          {!showOtpInput ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <InternationalPhoneInput
                    value={phone}
                    onChange={(newPhone) => setPhone(newPhone)}
                    defaultCountry="bf"
                    inputClassName="w-full"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Envoi en cours...' : 'Envoyer le code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="otp">Code de vérification</Label>
                    <Input
                        id="otp"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="_ _ _ _ _ _"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {loading ? 'Vérification...' : 'Se connecter'}
                </Button>
                <Button variant="link" onClick={() => { setShowOtpInput(false); setError(null); }} className="w-full">
                    Changer de numéro
                </Button>
            </form>
          )}
        </CardContent>
      </Card>
      <footer className="w-full p-4 mt-6 text-center text-xs text-muted-foreground">
          <p className="mb-2">© {new Date().getFullYear()} BizBook. Conçu et développé par DLG Caverne Consortium.</p>
          <div className="flex flex-col items-center justify-center gap-y-1 sm:flex-row sm:gap-x-2">
              <span>Email: dlgbiomed@gmail.com</span>
              <span className="hidden sm:inline">|</span>
              <span>Tél: +226 25 46 55 12 / +226 70 15 06 99</span>
          </div>
      </footer>
    </div>
  );
}
