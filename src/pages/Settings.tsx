// Página de configurações
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Lock, Palette, DollarSign } from 'lucide-react';
import { useEffect } from 'react';

export default function Settings() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [currency, setCurrency] = useState('BRL');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
    document.documentElement.classList.toggle('dark', checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não conferem',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsChangingPassword(false);

    if (error) {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi alterada com sucesso.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Configurações</h2>
        <p className="text-muted-foreground">
          Personalize sua experiência no FinanceApp
        </p>
      </div>

      {/* Informações da conta */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Informações da Conta</h3>
            <p className="text-sm text-muted-foreground">Seus dados de acesso</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>

          <div className="space-y-2">
            <Label>ID do Usuário</Label>
            <Input value={user?.id || ''} disabled className="font-mono text-xs" />
          </div>
        </div>
      </div>

      {/* Alterar senha */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Alterar Senha</h3>
            <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={isChangingPassword || !newPassword}>
            {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Alterar Senha
          </Button>
        </form>
      </div>

      {/* Preferências */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Preferências</h3>
            <p className="text-sm text-muted-foreground">Personalize o aplicativo</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Tema */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tema Escuro</p>
              <p className="text-sm text-muted-foreground">
                Alternar entre tema claro e escuro
              </p>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>

          {/* Moeda */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Moeda Padrão</p>
              <p className="text-sm text-muted-foreground">
                Moeda utilizada para novas transações
              </p>
            </div>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL (R$)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sobre */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">Sobre o FinanceApp</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Versão: 1.0.0</p>
          <p>Sistema de Controle Financeiro Pessoal</p>
          <p>Desenvolvido com React, TypeScript e Lovable Cloud</p>
        </div>
      </div>
    </div>
  );
}
