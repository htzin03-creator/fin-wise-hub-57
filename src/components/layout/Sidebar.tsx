// Componente de menu lateral
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowUpDown,
  Target,
  FolderOpen,
  FileText,
  Settings,
  LogOut,
  Wallet,
  X,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNewTransactionNotifications } from '@/hooks/useNewTransactionNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowUpDown, label: 'Transações', path: '/transactions', showBadge: true },
  { icon: Building2, label: 'Contas Bancárias', path: '/bank-accounts' },
  { icon: Target, label: 'Metas', path: '/goals' },
  { icon: FolderOpen, label: 'Categorias', path: '/categories' },
  { icon: FileText, label: 'Relatórios', path: '/reports' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { signOut, user } = useAuth();
  const { newTransactionsCount, markAllAsSeen } = useNewTransactionNotifications();
  const location = useLocation();

  // Marca como visto quando navegar para transações
  useEffect(() => {
    if (location.pathname === '/transactions' && newTransactionsCount > 0) {
      markAllAsSeen();
    }
  }, [location.pathname, newTransactionsCount, markAllAsSeen]);

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">FinanceApp</h1>
              <p className="text-xs text-muted-foreground">Controle Financeiro</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.showBadge && newTransactionsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="h-5 min-w-5 px-1.5 text-xs animate-pulse"
                >
                  {newTransactionsCount > 99 ? '99+' : newTransactionsCount}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="mb-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Conta ativa</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair da conta
          </Button>
        </div>
      </aside>
    </>
  );
}
