import { ReactNode } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { Wallet, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { signedAccountId, loading, signIn } = useNearWallet();

  // Show loading state while checking wallet connection
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // If not connected, show login required message
  if (!signedAccountId) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="relative mb-8">
            <div className="p-6 rounded-full bg-primary/10 inline-block">
              <Lock className="h-16 w-16 text-primary" />
            </div>
            <div className="absolute top-0 right-1/3 p-2 rounded-full bg-secondary">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            LOGIN Required
          </h1>
          
          <p className="text-muted-foreground mb-8 text-lg">
            Please LOGIN to access this page and start using NOVAMarket features.
          </p>
          
          <Button
            onClick={signIn}
            size="lg"
            className="glow gap-2 text-lg px-8"
          >
            <Wallet className="h-5 w-5" />
            LOGIN
          </Button>
          
          <div className="mt-8 p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Why connect?</strong>
              <br />
              Your wallet is needed to interact with the NEAR blockchain, 
              upload encrypted files, and trade on the marketplace.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Wallet is connected, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;