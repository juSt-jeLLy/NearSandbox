import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageTransition from '@/components/PageTransition';
import { OpenAPI, QuoteRequest, OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import { useMarketplaceListings } from '@/components/useMarketplaceListings';
import { ProductCard } from '@/components/ProductCard';

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.TOKEN;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [buyingListingId, setBuyingListingId] = useState<number | null>(null);

  // Fetch listings from NEAR contract
  const { listings, loading, error } = useMarketplaceListings();

  const onBuyClick = async (listing: any) => {
    console.log('Buy clicked for listing:', listing);
    setBuyingListingId(listing.product_id);
    
    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      
      const quoteRequest: QuoteRequest = {
        dry: false,
        swapType: QuoteRequest.swapType.EXACT_INPUT,
        slippageTolerance: 100,
        originAsset: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
        depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
        destinationAsset: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near',
        amount: '1000000',
        refundTo: '0x2527D02599Ba641c19FEa793cD0F167589a0f10D',
        refundType: QuoteRequest.refundType.ORIGIN_CHAIN, 
        recipient: '13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK',
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
        deadline: deadline.toISOString()
      };
      
      console.log('Requesting quote with:', JSON.stringify(quoteRequest, null, 2));
      
      const quote = await OneClickService.getQuote(quoteRequest);
      console.log('Quote received:', quote);
      
    } catch (err: any) {
      console.error('Failed to get quote:', err);
      
      let errorMessage = 'Failed to get quote. Please try again.';
      
      if (err.body) {
        console.error('Error body:', err.body);
        errorMessage = `API Error: ${err.body.message || err.body.error || JSON.stringify(err.body)}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Error message:', errorMessage);
    } finally {
      setBuyingListingId(null);
    }
  };

  const filteredListings = listings.filter(
    (listing) =>
      listing.is_active && (
        listing.nova_group_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.cid.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <PageTransition>
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-primary">NOVA</span> Marketplace
            </h1>
            <p className="text-muted-foreground">
              Browse and buy encrypted digital assets securely on NEAR
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by group ID or CID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading listings from blockchain...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-red-500/10 inline-block mb-4">
                <Lock className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-500">Error Loading Listings</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}

          {/* Items Grid */}
          {!loading && !error && viewMode === 'grid' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredListings.map((listing) => (
                <motion.div key={listing.product_id} variants={itemVariants}>
                  <ProductCard
                    listing={listing}
                    onBuy={onBuyClick}
                    isBuying={buyingListingId === listing.product_id}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Items List */}
          {!loading && !error && viewMode === 'list' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredListings.map((listing) => (
                <motion.div key={listing.product_id} variants={itemVariants}>
                  <ProductCard
                    listing={listing}
                    onBuy={onBuyClick}
                    isBuying={buyingListingId === listing.product_id}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredListings.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="p-4 rounded-full bg-secondary inline-block mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No results found' : 'No listings available'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to create a listing!'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Marketplace;