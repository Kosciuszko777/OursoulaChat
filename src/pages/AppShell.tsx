import { useState, useCallback } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  Settings,
  Moon,
  Sun,
  Lock,
  Users,
  PenSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useConversations, type Conversation } from '@/hooks/useConversations';
import { LoginArea } from '@/components/auth/LoginArea';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog';
import { ConversationList } from '@/components/chat/ConversationList';
import { ConversationSearch } from '@/components/chat/ConversationSearch';
import { Onboarding } from '@/components/chat/Onboarding';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * The main app chrome. Renders a sidebar + content area on desktop,
 * or a single-column layout on mobile. Child routes render in <Outlet />.
 */
export default function AppShell() {
  const { theme, setTheme } = useTheme();
  const { user } = useCurrentUser();
  const location = useLocation();
  const { conversations, isLoading: isLoadingConversations } = useConversations();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('oursula:onboarded');
  });
  const t = useT();

  const isSettings = location.pathname.startsWith('/app/settings');
  const isChat = location.pathname.startsWith('/app/chat/') || location.pathname.startsWith('/app/group/');

  const handleOnboardingComplete = () => {
    localStorage.setItem('oursula:onboarded', '1');
    setShowOnboarding(false);
  };

  // If user completes onboarding via the login flow, mark it done
  const handleLoginInstead = () => {
    localStorage.setItem('oursula:onboarded', '1');
    setShowOnboarding(false);
  };

  // Show onboarding for first-time users who aren't logged in
  if (showOnboarding && !user) {
    return (
      <div className="h-dvh flex flex-col bg-background text-foreground">
        <header className="flex-none flex items-center justify-between px-4 py-2.5 border-b bg-card">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Lock className="size-4 text-brand-indigo" />
            <span className="text-sm">{t('app.name')}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="rounded-full size-8"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </header>
        <Onboarding onComplete={handleOnboardingComplete} onLoginInstead={handleLoginInstead} />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex-none flex items-center justify-between px-4 py-2.5 border-b bg-card">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Lock className="size-4 text-brand-indigo" />
          <span className="text-sm">{t('app.name')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="rounded-full size-8"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <LoginArea className="max-w-48" />
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar — visible on md+ */}
        <aside className="hidden md:flex flex-col w-80 border-r bg-card">
          <SidebarContent
            user={user}
            conversations={conversations}
            isLoading={isLoadingConversations}
            onNewChat={() => setNewChatOpen(true)}
            onNewGroup={() => setNewGroupOpen(true)}
          />
        </aside>

        {/* Mobile: show conversation list OR the content */}
        <div className="flex-1 flex flex-col md:hidden">
          {isChat || isSettings ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <Outlet />
            </div>
          ) : (
            <>
              <div className="flex-1 flex flex-col min-h-0">
                <SidebarContent
                  user={user}
                  conversations={conversations}
                  isLoading={isLoadingConversations}
                  onNewChat={() => setNewChatOpen(true)}
                  onNewGroup={() => setNewGroupOpen(true)}
                />
              </div>

              {/* Mobile bottom tab bar */}
              <nav className="flex-none flex border-t bg-card" role="tablist">
                <MobileTab
                  icon={<MessageCircle className="size-5" />}
                  label={t('nav.chats')}
                  active={!isSettings}
                />
                <MobileTab
                  icon={<Settings className="size-5" />}
                  label={t('nav.settings')}
                  active={isSettings}
                  href="/app/settings"
                />
              </nav>
            </>
          )}
        </div>

        {/* Desktop: content area for child routes */}
        <main className="hidden md:flex flex-1 flex-col min-h-0">
          <Outlet />
        </main>
      </div>

      <NewChatDialog isOpen={newChatOpen} onClose={() => setNewChatOpen(false)} />
      <CreateGroupDialog isOpen={newGroupOpen} onClose={() => setNewGroupOpen(false)} />
    </div>
  );
}

/** The conversation list + action buttons shown in the sidebar / mobile main area. */
function SidebarContent({
  user,
  conversations,
  isLoading,
  onNewChat,
  onNewGroup,
}: {
  user: ReturnType<typeof useCurrentUser>['user'];
  conversations: Conversation[];
  isLoading: boolean;
  onNewChat: () => void;
  onNewGroup: () => void;
}) {
  const t = useT();
  const [filteredConvos, setFilteredConvos] = useState<Conversation[] | null>(null);
  const handleFilter = useCallback((filtered: Conversation[] | null) => {
    setFilteredConvos(filtered);
  }, []);

  const displayConvos = filteredConvos ?? conversations;

  return (
    <>
      {/* Sidebar header */}
      <div className="flex-none flex items-center justify-between px-4 py-3 gap-2">
        {/* Search takes over when open */}
        <h2 className="font-semibold text-lg flex-none">{t('nav.chats')}</h2>
        <div className="flex items-center gap-1 flex-1 justify-end">
          <ConversationSearch conversations={conversations} onFilter={handleFilter} />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-8"
            aria-label={t('chat.newChat')}
            onClick={onNewChat}
          >
            <PenSquare className="size-4" />
          </Button>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="pb-4">
          {!user ? (
            <EmptyState
              icon={<Lock className="size-8 text-brand-indigo" />}
              title={t('chat.empty.loggedOut.title')}
              description={t('chat.empty.loggedOut.body')}
            />
          ) : filteredConvos !== null && filteredConvos.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="size-8 text-muted-foreground" />}
              title={t('chat.search.noResults')}
              description=""
            />
          ) : displayConvos.length === 0 && !isLoading ? (
            <EmptyState
              icon={<MessageCircle className="size-8 text-brand-indigo" />}
              title={t('chat.empty.noConvos.title')}
              description={t('chat.empty.noConvos.body')}
            />
          ) : (
            <ConversationList
              conversations={displayConvos}
              currentUserPubkey={user.pubkey}
              isLoading={isLoading}
            />
          )}
        </div>
      </ScrollArea>

      {/* Quick links */}
      <div className="flex-none p-3 border-t space-y-1 hidden md:block">
        <Link
          to="/app/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Settings className="size-4" />
          {t('nav.settings')}
        </Link>
        <button
          type="button"
          onClick={onNewGroup}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full text-left"
        >
          <Users className="size-4" />
          {t('chat.newGroup')}
        </button>
      </div>
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
}

function MobileTab({
  icon,
  label,
  active,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const cls = cn(
    'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
    active ? 'text-brand-indigo' : 'text-muted-foreground',
  );

  if (href) {
    return (
      <Link to={href} className={cls} onClick={onClick} role="tab" aria-selected={active}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} onClick={onClick} role="tab" aria-selected={active}>
      {icon}
      {label}
    </button>
  );
}
