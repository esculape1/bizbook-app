'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  UserPlus,
  Copy,
  Check,
  Trash2,
  Shield,
  UserCog,
  Clock,
  Mail,
  Loader2,
  Link2,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/constants';
import type { Profile, Invitation, User } from '@/lib/types';
import {
  createInviteLink,
  updateMemberRole,
  removeMember,
  revokeInvitation,
} from './actions';

const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'SuperAdmin',
  [ROLES.ADMIN]: 'Finance/Achats',
  [ROLES.USER]: 'Ventes',
};

const ROLE_COLORS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'bg-primary text-primary-foreground',
  [ROLES.ADMIN]: 'bg-amber-100 text-amber-800',
  [ROLES.USER]: 'bg-sky-100 text-sky-800',
};

export function TeamDashboard({
  members,
  invitations,
  currentUser,
}: {
  members: Profile[];
  invitations: Invitation[];
  currentUser: User;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;

  const handleCreateInvite = () => {
    startTransition(async () => {
      const result = await createInviteLink(inviteEmail || undefined);
      if (result.success && result.link) {
        setGeneratedLink(result.link);
        setInviteEmail('');
        toast({ title: 'Invitation creee', description: 'Le lien a ete genere avec succes.' });
      } else {
        toast({ title: 'Erreur', description: result.message, variant: 'destructive' });
      }
    });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
    toast({ title: 'Copie !', description: 'Le lien a ete copie dans le presse-papiers.' });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole);
      if (result.success) {
        toast({ title: 'Role modifie', description: 'Le role a ete mis a jour.' });
      } else {
        toast({ title: 'Erreur', description: result.message, variant: 'destructive' });
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result.success) {
        toast({ title: 'Membre supprime', description: 'Le membre a ete retire de l\'equipe.' });
      } else {
        toast({ title: 'Erreur', description: result.message, variant: 'destructive' });
      }
    });
  };

  const handleRevokeInvitation = (invitationId: string) => {
    startTransition(async () => {
      const result = await revokeInvitation(invitationId);
      if (result.success) {
        toast({ title: 'Invitation revoquee' });
      } else {
        toast({ title: 'Erreur', description: result.message, variant: 'destructive' });
      }
    });
  };

  const pendingInvitations = invitations.filter(i => !i.used && new Date(i.expiresAt) > new Date());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {"Gestion de l'equipe"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {"Gerez les membres de votre organisation et invitez de nouveaux collaborateurs."}
        </p>
      </div>

      {/* Invite Section */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <UserPlus className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Inviter un membre</CardTitle>
              <CardDescription>{"Generez un lien d'invitation a partager"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email (optionnel)
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="collaborateur@entreprise.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateInvite} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  {"Generer le lien"}
                </Button>
              </div>
            </div>

            {generatedLink && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <code className="flex-1 text-xs break-all font-mono">{generatedLink}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyLink(generatedLink)}
                >
                  {copiedLink === generatedLink ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGeneratedLink(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-foreground/10">
              <UserCog className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Membres ({members.length})
              </CardTitle>
              <CardDescription>{"Les membres de votre organisation"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y">
            {members.map((member) => {
              const isCurrentUser = member.id === currentUser.id;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={`https://i.pravatar.cc/150?u=${member.email}`}
                        alt={member.fullName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {member.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">
                        {member.fullName}
                        {isCurrentUser && (
                          <span className="text-muted-foreground font-normal ml-1">(vous)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isSuperAdmin && !isCurrentUser ? (
                      <Select
                        defaultValue={member.role}
                        onValueChange={(val) => handleRoleChange(member.id, val)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ROLES.SUPER_ADMIN}>
                            <div className="flex items-center gap-2">
                              <Shield className="size-3" />
                              SuperAdmin
                            </div>
                          </SelectItem>
                          <SelectItem value={ROLES.ADMIN}>
                            <div className="flex items-center gap-2">
                              <UserCog className="size-3" />
                              Finance/Achats
                            </div>
                          </SelectItem>
                          <SelectItem value={ROLES.USER}>
                            <div className="flex items-center gap-2">
                              <Mail className="size-3" />
                              Ventes
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={ROLE_COLORS[member.role] || 'bg-muted'}>
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    )}

                    {isSuperAdmin && !isCurrentUser && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {`${member.fullName} sera retire de votre organisation. Cette action est irreversible.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="size-5 text-amber-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Invitations en attente ({pendingInvitations.length})
                </CardTitle>
                <CardDescription>{"Invitations qui n'ont pas encore ete utilisees"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {pendingInvitations.map((invitation) => {
                const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?invite=${invitation.token}`;
                return (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {invitation.email || 'Lien generique'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {'Expire le '}
                        {new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(inviteLink)}
                        className="h-8"
                      >
                        {copiedLink === inviteLink ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span className="ml-1">Copier</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        className="h-8 text-destructive hover:text-destructive"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
