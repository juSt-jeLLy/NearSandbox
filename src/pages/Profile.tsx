import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Wallet, Shield, Activity, Copy, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageTransition from '@/components/PageTransition';
import GlowCard from '@/components/GlowCard';
import { isNovaConfigured, getBalance, authStatus, getNetworkInfo, getTransactionsForGroup } from '@/services/novaService';
import { toast } from 'sonner';

const Profile = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    setIsConfigured(isNovaConfigured());
    if (isNovaConfigured()) {
      try {
        setNetworkInfo(getNetworkInfo());
      } catch (e) {
        console.error('Failed to get network info:', e);
      }
    }
  }, []);

  const fetchAccountInfo = async () => {
    if (!isConfigured) return;
    
    setIsLoading(true);
    try {
      const [balanceResult, authResult] = await Promise.all([
        getBalance().catch(() => null),
        authStatus().catch(() => null),
      ]);
      
      setBalance(balanceResult);
      setAccountInfo(authResult);
      toast.success('Account info refreshed');
    } catch (e: any) {
      toast.error('Failed to fetch account info: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!groupIdInput.trim()) {
      toast.error('Please enter a group ID');
      return;
    }
    
    setIsLoading(true);
    try {
      const txs = await getTransactionsForGroup(groupIdInput.trim());
      setTransactions(txs || []);
      toast.success(`Found ${txs?.length || 0} transactions`);
    } catch (e: any) {
      toast.error('Failed to fetch transactions: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <PageTransition>
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-primary">Profile</span> & Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your NOVA account and view activity
            </p>
          </motion.div>

          {/* Configuration Status */}
          {!isConfigured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <GlowCard glowOnHover={false}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">NOVA Not Configured</h3>
                    <p className="text-muted-foreground mb-4">
                      To use NOVA features, please set the following environment variables:
                    </p>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="p-2 rounded bg-secondary">
                        VITE_NOVA_ACCOUNT_ID=yourname.nova-sdk-5.testnet
                      </div>
                      <div className="p-2 rounded bg-secondary">
                        VITE_NOVA_API_KEY=nova_sk_xxxxxxxxxxxxx
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Get your API key at{' '}
                      <a
                        href="https://nova-sdk.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        nova-sdk.com
                      </a>
                    </p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlowCard className="h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Account</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchAccountInfo}
                    disabled={!isConfigured || isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="space-y-4">
                  {networkInfo && (
                    <>
                      <div className="p-3 rounded-lg bg-secondary">
                        <span className="text-sm text-muted-foreground">Account ID</span>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-sm truncate mr-2">
                            {networkInfo.accountId || 'Not connected'}
                          </p>
                          {networkInfo.accountId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(networkInfo.accountId, 'Account ID')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary">
                        <span className="text-sm text-muted-foreground">Network</span>
                        <p className="font-medium">{networkInfo.networkId || 'testnet'}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary">
                        <span className="text-sm text-muted-foreground">Contract</span>
                        <p className="font-mono text-sm truncate">
                          {networkInfo.contractId || 'nova-sdk-5.testnet'}
                        </p>
                      </div>
                    </>
                  )}

                  {accountInfo && (
                    <div className="p-3 rounded-lg bg-secondary">
                      <span className="text-sm text-muted-foreground">Auth Status</span>
                      <p className="font-medium text-primary">Authenticated</p>
                    </div>
                  )}
                </div>
              </GlowCard>
            </motion.div>

            {/* Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlowCard className="h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Balance</h2>
                </div>

                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {balance ? `${parseFloat(balance).toFixed(4)} NEAR` : '---'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isConfigured ? 'Available on testnet' : 'Connect to view balance'}
                  </p>
                </div>

                <Button
                  onClick={fetchAccountInfo}
                  disabled={!isConfigured || isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Balance
                </Button>
              </GlowCard>
            </motion.div>

            {/* Security Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlowCard className="h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Security</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm">Encryption</span>
                    <span className="text-primary font-medium">AES-256-GCM</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm">Key Storage</span>
                    <span className="text-primary font-medium">TEE (Shade)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm">Storage</span>
                    <span className="text-primary font-medium">IPFS</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm">Blockchain</span>
                    <span className="text-primary font-medium">NEAR</span>
                  </div>
                </div>
              </GlowCard>
            </motion.div>

            {/* Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlowCard className="h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Activity</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupIdLookup">Group ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="groupIdLookup"
                        placeholder="Enter group ID"
                        value={groupIdInput}
                        onChange={(e) => setGroupIdInput(e.target.value)}
                        disabled={!isConfigured}
                      />
                      <Button
                        onClick={fetchTransactions}
                        disabled={!isConfigured || isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Fetch'
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {transactions.length > 0 ? (
                      transactions.map((tx, index) => (
                        <div key={index} className="p-2 rounded bg-secondary text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs truncate max-w-[150px]">
                              {tx.trans_id || tx.id || 'Unknown'}
                            </span>
                            <a
                              href={`https://testnet.nearblocks.io/txns/${tx.trans_id || tx.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isConfigured ? 'Enter a group ID to view transactions' : 'Configure NOVA to view activity'}
                      </p>
                    )}
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;
