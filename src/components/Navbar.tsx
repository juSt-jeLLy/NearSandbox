import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Upload, Store, User, Wallet, LogOut, Settings, CheckCircle, AlertCircle, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNearWallet } from 'near-connect-hooks';
import NovaSetupModal from '@/components/NovaSetupModal';
import { hasNovaCredentials, getNovaCredentials } from '@/services/novaCredentialsService';
import { toast } from 'sonner';

const navItems = [
  { path: '/', label: 'Home', icon: Shield },
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/marketplace', label: 'Marketplace', icon: Store },
  { path: '/profile', label: 'Profile', icon: User },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNovaSetup, setShowNovaSetup] = useState(false);
  const [novaConfigured, setNovaConfigured] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { signedAccountId, loading, signIn, signOut } = useNearWallet();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWalletDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if NOVA credentials exist for current wallet
  useEffect(() => {
    if (signedAccountId) {
      const hasCredentials = hasNovaCredentials(signedAccountId);
      setNovaConfigured(hasCredentials);

      if (!hasCredentials) {
        setTimeout(() => {
          toast.info('Please setup your NOVA credentials to access all features');
          setShowNovaSetup(true);
        }, 1000);
      } else {
        const creds = getNovaCredentials(signedAccountId);
        if (creds) {
          toast.success(`NOVA account loaded: ${creds.accountId}`);
        }
      }
    } else {
      setNovaConfigured(false);
    }
  }, [signedAccountId]);

  const handleSignIn = () => signIn();

  const handleSignOut = () => {
    setShowWalletDropdown(false);
    signOut();
  };

  const handleCopyAddress = () => {
    if (signedAccountId) {
      navigator.clipboard.writeText(signedAccountId);
      toast.success('Address copied!');
    }
  };

  const handleNovaSetup = () => {
    if (!signedAccountId) {
      toast.error('Please connect your wallet first');
      return;
    }
    setShowWalletDropdown(false);
    setShowNovaSetup(true);
  };

  const handleCredentialsSaved = () => {
    setNovaConfigured(true);
  };

  const truncateAccountId = (accountId: string) => {
    if (accountId.length <= 20) return accountId;
    return `${accountId.slice(0, 8)}...${accountId.slice(-8)}`;
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <div className="relative">
                  <Shield className="h-8 w-8 text-primary" />
                  <div className="absolute inset-0 blur-lg bg-primary/30" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  NOVA<span className="text-primary">Market</span>
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={`gap-2 ${isActive ? 'glow' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}

              {/* NOVA Setup Button (when wallet connected but NOVA not configured) */}
              {signedAccountId && !novaConfigured && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="ml-2">
                  <Button
                    onClick={handleNovaSetup}
                    variant="outline"
                    className="gap-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Setup NOVA
                  </Button>
                </motion.div>
              )}

              {/* NOVA Settings Button (when configured) */}
              {signedAccountId && novaConfigured && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="ml-2">
                  <Button onClick={handleNovaSetup} variant="ghost" size="icon" className="relative">
                    <Settings className="h-4 w-4" />
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle className="h-3 w-3 text-green-500 fill-green-500" />
                    </div>
                  </Button>
                </motion.div>
              )}

              {/* Wallet Button with dropdown */}
              <div className="relative ml-2" ref={dropdownRef}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={signedAccountId ? () => setShowWalletDropdown(!showWalletDropdown) : handleSignIn}
                    disabled={loading}
                    variant={signedAccountId ? 'outline' : 'default'}
                    className={`gap-2 ${signedAccountId ? 'glow' : ''}`}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Loading...
                      </>
                    ) : signedAccountId ? (
                      <>
                        <Wallet className="h-4 w-4" />
                        {truncateAccountId(signedAccountId)}
                        <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${showWalletDropdown ? 'rotate-180' : ''}`} />
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" />
                        LOGIN
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Dropdown */}
                <AnimatePresence>
                  {showWalletDropdown && signedAccountId && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-background shadow-xl overflow-hidden z-50"
                    >
                      {/* Account info */}
                      <div className="px-4 py-3 border-b border-border bg-secondary/30">
                        <p className="text-xs text-muted-foreground mb-0.5">Connected as</p>
                        <p className="text-sm font-mono font-semibold truncate">{signedAccountId}</p>
                      </div>

                      {/* Copy address */}
                      <button
                        onClick={handleCopyAddress}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-left"
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                        Copy Address
                      </button>

                      <div className="border-t border-border" />

                      {/* Disconnect */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden md:hidden border-t border-border bg-background"
        >
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </motion.div>
                </Link>
              );
            })}

            {/* Mobile NOVA Setup Button */}
            {signedAccountId && (
              <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                <Button
                  onClick={() => { handleNovaSetup(); setIsOpen(false); }}
                  variant="outline"
                  className={`w-full gap-2 ${
                    novaConfigured
                      ? 'border-green-500/50 text-green-500 hover:bg-green-500/10'
                      : 'border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10'
                  }`}
                >
                  {novaConfigured ? (
                    <><CheckCircle className="h-5 w-5" /> NOVA Settings</>
                  ) : (
                    <><AlertCircle className="h-5 w-5" /> Setup NOVA</>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Mobile: account info + disconnect when connected, login when not */}
            {signedAccountId ? (
              <>
                <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Connected as</p>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-sm font-mono font-semibold truncate">{signedAccountId}</p>
                  </div>
                </div>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => { setIsOpen(false); signOut(); }}
                    variant="outline"
                    className="w-full gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Disconnect Wallet
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                <Button
                  onClick={() => { handleSignIn(); setIsOpen(false); }}
                  disabled={loading}
                  variant="default"
                  className="w-full gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5" />
                      LOGIN
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.nav>

      {/* NOVA Setup Modal */}
      {signedAccountId && (
        <NovaSetupModal
          isOpen={showNovaSetup}
          onClose={() => setShowNovaSetup(false)}
          nearWallet={signedAccountId}
          onCredentialsSaved={handleCredentialsSaved}
        />
      )}
    </>
  );
};

export default Navbar;