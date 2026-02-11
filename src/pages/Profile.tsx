import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Wallet, Shield, Activity, Copy, ExternalLink, RefreshCw, AlertCircle, Package, ShoppingCart, TrendingUp, Clock, CheckCircle, XCircle, Download, Loader2, UserPlus, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/PageTransition';
import GlowCard from '@/components/GlowCard';
import { isNovaConfigured, getBalance, authStatus, getNetworkInfo, getTransactionsForGroup } from '@/services/novaService';
import { 
  getUserProfileData,
  UserStats,
  ListingWithAccessInfo,
  PurchasedItemWithAccessInfo,
  retrieveAndDownloadFile 
} from '@/services/profileService';
import { 
  grantAccessToAllPendingBuyers,
  getPendingAccessBuyers 
} from '@/services/buyerAccessService';
import { useNearWallet } from 'near-connect-hooks';
import { toast } from 'sonner';

const Profile = () => {
  const { viewFunction, signedAccountId, callFunction } = useNearWallet();
  
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
  
  // Grant access state
  const [grantingAccessProductId, setGrantingAccessProductId] = useState<number | null>(null);
  const [testingAccessProductId, setTestingAccessProductId] = useState<number | null>(null);
  
  // Download state
  const [downloadingProductId, setDownloadingProductId] = useState<number | null>(null);


useEffect(() => {
  if (signedAccountId) {  
    setIsConfigured(isNovaConfigured(signedAccountId)); 
    if (isNovaConfigured(signedAccountId)) {
      try {
        setNetworkInfo(getNetworkInfo(signedAccountId));  
      } catch (e) {
        console.error('Failed to get network info:', e);
      }
    }
  }
}, [signedAccountId]);

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

  const handleDownloadFile = async (item: PurchasedItemWithAccessInfo) => {
    if (!isConfigured) {
      toast.error('NOVA not configured. Please set up your credentials.');
      return;
    }

    setDownloadingProductId(item.product_id);
    
    try {
await retrieveAndDownloadFile(
  item.nova_group_id,
  item.cid,
  item.product_id,
  item.list_type,
  signedAccountId  // CRITICAL: Pass buyer's wallet
);
    } catch (error) {
      // Error handling is done in retrieveAndDownloadFile
      console.error('Download failed:', error);
    } finally {
      setDownloadingProductId(null);
    }
  };

  const handleGrantAccess = async (listing: ListingWithAccessInfo) => {
    if (!isConfigured) {
      toast.error('NOVA not configured. Cannot grant access without NOVA credentials.');
      return;
    }

    if (!callFunction) {
      toast.error('Wallet not connected');
      return;
    }

    if (listing.pendingBuyers === 0) {
      toast.info('No pending buyers to grant access');
      return;
    }

    setGrantingAccessProductId(listing.product_id);
    
    try {
      toast.info(`Granting access to ${listing.pendingBuyers} buyer(s)...`);
      
const result = await grantAccessToAllPendingBuyers(
  listing.product_id,
  listing.nova_group_id,
  viewFunction,
  callFunction,
  signedAccountId!,  // CRITICAL: Pass owner's wallet (add ! since we know it exists here)
  (current, total, buyer) => {
    toast.info(`Processing ${current}/${total}: ${buyer}`);
  }
);
      if (result.success.length > 0) {
        toast.success(`✅ Granted access to ${result.success.length} buyer(s)`);
      }
      
      if (result.failed.length > 0) {
        toast.error(`❌ Failed to grant access to ${result.failed.length} buyer(s)`);
      }
      
      // Refresh listings to show updated status
      await fetchMarketplaceStats();
      
    } catch (error: any) {
      console.error('Failed to grant access:', error);
      toast.error(`Failed to grant access: ${error.message}`);
    } finally {
      setGrantingAccessProductId(null);
    }
  };

  const handleTestGrantAccess = async (listing: ListingWithAccessInfo) => {
    if (!callFunction) {
      toast.error('Wallet not connected');
      return;
    }

    if (listing.pendingBuyers === 0) {
      toast.info('No pending buyers to test');
      return;
    }

    setTestingAccessProductId(listing.product_id);
    
    try {
      toast.info('Getting pending buyers...');
      
      // Get pending buyers
      const pendingBuyers = await getPendingAccessBuyers(listing.product_id, viewFunction);
      
      if (pendingBuyers.length === 0) {
        toast.info('No pending buyers found');
        return;
      }
      
      toast.info(`Testing: Marking ${pendingBuyers.length} buyer(s) as having access (contract only)...`);
      
      // Grant access to each buyer (CONTRACT ONLY - no NOVA)
      for (let i = 0; i < pendingBuyers.length; i++) {
        const buyer = pendingBuyers[i];
        toast.info(`Processing ${i + 1}/${pendingBuyers.length}: ${buyer}`);
        
        try {
          await callFunction({
            contractId: 'marketplace-1770558741.testnet',
            method: 'grant_buyer_access',
            args: {
              p_id: listing.product_id,
              buyer: buyer,
            },
          });
        } catch (error) {
          console.error(`Failed to grant access to ${buyer}:`, error);
          toast.error(`Failed for ${buyer}`);
        }
      }
      
      toast.success(`✅ Test complete: Updated contract for ${pendingBuyers.length} buyer(s)`);
      toast.warning('⚠️ Note: Buyers still cannot decrypt files (no NOVA access)');
      
      // Refresh listings
      await fetchMarketplaceStats();
      
    } catch (error: any) {
      console.error('Test grant access failed:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTestingAccessProductId(null);
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
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex items-center gap-4 text-sm mb-2">
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
                          
                          {/* Action Buttons */}
                          {listing.pendingBuyers > 0 && (
                            <div className="flex gap-2 mt-2">
                              {/* Grant Access Button - Full flow (NOVA + Contract) */}
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleGrantAccess(listing)}
                                disabled={grantingAccessProductId === listing.product_id || !isConfigured}
                              >
                                {grantingAccessProductId === listing.product_id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Granting...
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Grant Access ({listing.pendingBuyers})
                                  </>
                                )}
                              </Button>
                              
                              {/* Test Button - Contract only (no NOVA) */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleTestGrantAccess(listing)}
                                disabled={testingAccessProductId === listing.product_id}
                              >
                                {testingAccessProductId === listing.product_id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Testing...
                                  </>
                                ) : (
                                  <>
                                    <TestTube className="h-3 w-3 mr-1" />
                                    Test ({listing.pendingBuyers})
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          
                          {/* Info messages */}
                          {!isConfigured && listing.pendingBuyers > 0 && (
                            <p className="text-xs text-yellow-500 mt-2">
                              ⚠️ Configure NOVA to grant real access
                            </p>
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
                      
                      {/* Access Status and Actions */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                        {getAccessBadge(item.accessStatus)}
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1"
                            onClick={() => copyToClipboard(item.cid, 'CID')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy CID
                          </Button>
                          
                          {/* Download Button - Only show if access is granted */}
                          {item.accessStatus === 'granted' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-xs h-auto py-1 px-2"
                              onClick={() => handleDownloadFile(item)}
                              disabled={downloadingProductId === item.product_id || !isConfigured}
                            >
                              {downloadingProductId === item.product_id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </>
                              )}
                            </Button>
                          )}
                        </div>
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