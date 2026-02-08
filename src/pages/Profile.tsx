import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Wallet, Shield, Activity, Copy, ExternalLink, RefreshCw, AlertCircle, Package, ShoppingCart, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageTransition from '@/components/PageTransition';
import GlowCard from '@/components/GlowCard';
import { isNovaConfigured, getBalance, authStatus, getNetworkInfo, getTransactionsForGroup } from '@/services/novaService';
import { 
  getUserProfileData,
  UserStats,
  ListingWithAccessInfo,
  PurchasedItemWithAccessInfo 
} from '@/services/profileService';
import { useNearWallet } from 'near-connect-hooks';
import { toast } from 'sonner';

const Profile = () => {
  const { viewFunction, signedAccountId } = useNearWallet();
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Marketplace stats with access info
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [createdListings, setCreatedListings] = useState<ListingWithAccessInfo[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItemWithAccessInfo[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

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

  // Fetch marketplace stats when user connects wallet
  useEffect(() => {
    if (signedAccountId && viewFunction) {
      fetchMarketplaceStats();
    }
  }, [signedAccountId, viewFunction]);

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

  const fetchMarketplaceStats = async () => {
    if (!signedAccountId || !viewFunction) return;
    
    setLoadingStats(true);
    try {
      // Use the comprehensive profile data function
      const profileData = await getUserProfileData(viewFunction, signedAccountId);
      
      setUserStats(profileData.stats);
      setCreatedListings(profileData.createdListings);
      setPurchasedItems(profileData.purchasedItems);
      
    } catch (e: any) {
      console.error('Failed to fetch marketplace stats:', e);
      toast.error('Failed to load marketplace data');
    } finally {
      setLoadingStats(false);
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

  const getAccessBadge = (accessStatus: 'pending' | 'granted' | 'unknown') => {
    switch (accessStatus) {
      case 'granted':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">
            <CheckCircle className="h-3 w-3" />
            Access Granted
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
            <Clock className="h-3 w-3" />
            Pending Access
          </div>
        );
      case 'unknown':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-500">
            <AlertCircle className="h-3 w-3" />
            Unknown
          </div>
        );
    }
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
                        VITE_NOVA_ACCOUNT_ID=yourname.nova-sdk.near
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

          {/* Marketplace Statistics */}
          {signedAccountId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Marketplace Overview</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchMarketplaceStats}
                  disabled={loadingStats}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Listings Created */}
                <GlowCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Listings Created</p>
                      <p className="text-3xl font-bold text-primary">
                        {loadingStats ? '...' : userStats?.listingsCreated || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </GlowCard>

                {/* Items Purchased */}
                <GlowCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Items Purchased</p>
                      <p className="text-3xl font-bold text-primary">
                        {loadingStats ? '...' : userStats?.itemsPurchased || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </GlowCard>

                {/* Total Spent */}
                <GlowCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                      <p className="text-3xl font-bold text-primary">
                        {loadingStats ? '...' : userStats?.totalSpent || 0} <span className="text-lg">NEAR</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </GlowCard>
              </div>
            </motion.div>
          )}

          {/* Created Listings Summary with Access Info */}
          {signedAccountId && createdListings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <GlowCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Your Listings</h2>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {createdListings.map((listing) => (
                    <div
                      key={listing.product_id}
                      className="p-3 rounded-lg bg-secondary"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Product #{listing.product_id}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              {listing.list_type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono truncate">
                            {listing.nova_group_id}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-primary">{listing.price} NEAR</p>
                          <p className="text-xs text-muted-foreground">
                            {listing.purchase_number} {listing.purchase_number === 1 ? 'sale' : 'sales'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Buyer Access Status */}
                      {listing.buyers.length > 0 && (
                        <div className="pt-2 border-t border-border/50 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">
                              {listing.activeBuyers} with access
                            </span>
                          </div>
                          {listing.pendingBuyers > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className="text-muted-foreground">
                                {listing.pendingBuyers} pending
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          )}

          {/* Purchased Items Summary with Access Status */}
          {signedAccountId && purchasedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <GlowCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Purchased Items</h2>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {purchasedItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="p-3 rounded-lg bg-secondary"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Product #{item.product_id}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              {item.list_type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono truncate">
                            {item.nova_group_id}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold">{item.price} NEAR</p>
                        </div>
                      </div>
                      
                      {/* Access Status */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        {getAccessBadge(item.accessStatus)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto p-1"
                          onClick={() => copyToClipboard(item.cid, 'CID')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy CID
                        </Button>
                      </div>
                      
                      {/* Access Message */}
                      {item.accessStatus === 'pending' && (
                        <p className="text-xs text-yellow-500 mt-2">
                          ⏳ Waiting for owner to grant NOVA access
                        </p>
                      )}
                      {item.accessStatus === 'granted' && (
                        <p className="text-xs text-green-500 mt-2">
                          ✓ You can decrypt and download this file
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;