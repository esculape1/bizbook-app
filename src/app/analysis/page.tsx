
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askAI } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/lib/types';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/AppLayout';
import { getSettings } from '@/lib/data';
import type { User as UserType, Settings } from '@/lib/types';
// We must not import getSession directly in a client component.
// Instead, we create a server action or an API route to get session data if needed,
// but for this case, we can pass it down from a parent server component.
// The main `AnalysisPage` will handle fetching server data.

function AnalysisPageContent() {
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setConversation(prev => [...prev, userMessage]);
    
    startTransition(async () => {
      const result = await askAI(input);
      if (result.status === 'error') {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.error,
        });
        // Remove the user message if there was an error
        setConversation(prev => prev.slice(0, -1));
      } else {
        const assistantMessage: ChatMessage = { role: 'assistant', content: result.response };
        setConversation(prev => [...prev, assistantMessage]);
      }
    });
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Analyse IA" />
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Assistant d'Analyse BizBook</h3>
              <p className="text-muted-foreground">
                Posez une question sur vos données d'entreprise pour commencer.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Ex: "Quel est mon chiffre d'affaires ce mois-ci ?"
              </p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div key={index} className={cn("flex items-start gap-4", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-prose p-3 rounded-lg", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="w-8 h-8 border">
                     <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
           {isPending && (
            <div className="flex items-start gap-4 justify-start">
              <Avatar className="w-8 h-8 border">
                <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
              </Avatar>
              <div className="max-w-prose p-3 rounded-lg bg-muted flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Analyse en cours...</span>
              </div>
            </div>
          )}
          <div ref={conversationEndRef} />
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question ici..."
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !input.trim()}>
              <Send className="w-4 h-4" />
              <span className="sr-only">Envoyer</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// This is now a Server Component that fetches data and passes it to the client component.
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AnalysisPage() {
    const [user, settings] = await Promise.all([
      getSession(),
      getSettings()
    ]);

    if (!user || !settings) {
        redirect('/login');
    }
    
    return (
        <AppLayout user={user} settings={settings}>
            <AnalysisPageContent />
        </AppLayout>
    );
}
