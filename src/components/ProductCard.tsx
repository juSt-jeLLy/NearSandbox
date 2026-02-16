import { Lock, Download, Eye, ShieldCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/GlowCard';

interface Listing {
  product_id: number;
  price: number;
  nova_group_id: string;
  owner: string;
  purchase_number: number;
  list_type: 'Image' | 'Dataset' | 'Audio' | 'Other';
  cid: string;
  is_active: boolean;
  is_tee_verified: boolean;
  tee_signature: number | null;
}

interface ProductCardProps {
  listing: Listing;
  onBuy: (listing: Listing) => void;
  onPreview?: (listing: Listing) => void;
  isBuying?: boolean;
}

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    Image: 'bg-blue-500/10 text-blue-400',
    Dataset: 'bg-purple-500/10 text-purple-400',
    Audio: 'bg-pink-500/10 text-pink-400',
    Other: 'bg-cyan-500/10 text-cyan-400',
  };
  return colors[type] || 'bg-primary/10 text-primary';
};

const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)} USDC`;
  }
  return `$${(price / 100).toFixed(2)}`;
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-yellow-500/10';
  if (score >= 40) return 'bg-orange-500/10';
  return 'bg-red-500/10';
};

export const ProductCard = ({ listing, onBuy, onPreview, isBuying = false }: ProductCardProps) => {
  return (
    <GlowCard className="h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(
                  listing.list_type
                )}`}
              >
                {listing.list_type}
              </span>
              
              {/* TEE Verification Badge */}
              {listing.is_tee_verified && listing.tee_signature !== null ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400">
                  <ShieldCheck className="h-3 w-3" />
                  TEE Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400">
                  <Shield className="h-3 w-3" />
                  Unverified
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg">Product #{listing.product_id}</h3>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* TEE Credibility Score */}
        {listing.is_tee_verified && listing.tee_signature !== null && (
          <div className={`p-3 rounded-lg ${getScoreBgColor(listing.tee_signature)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">AI Credibility Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(listing.tee_signature)}`}>
                  {listing.tee_signature}/100
                </p>
              </div>
              <ShieldCheck className={`h-8 w-8 ${getScoreColor(listing.tee_signature)}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {listing.tee_signature >= 80 && "Highly trustworthy product"}
              {listing.tee_signature >= 60 && listing.tee_signature < 80 && "Good quality product"}
              {listing.tee_signature >= 40 && listing.tee_signature < 60 && "Moderate quality"}
              {listing.tee_signature < 40 && "Low credibility - buy with caution"}
            </p>
          </div>
        )}

        {/* Group ID */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">NOVA Group</p>
          <p className="text-sm font-mono truncate">{listing.nova_group_id}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-semibold text-primary">{formatPrice(listing.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Purchases</p>
            <p className="font-semibold">{listing.purchase_number}</p>
          </div>
        </div>

        {/* CID Preview */}
        <div className="p-2 rounded-lg bg-secondary">
          <p className="text-xs text-muted-foreground mb-1">CID</p>
          <p className="font-mono text-xs truncate">{listing.cid}</p>
        </div>

        {/* Owner */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Owner</p>
          <p className="font-mono text-xs truncate">{listing.owner}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => onPreview?.(listing)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button 
            size="sm" 
            className="flex-1 gap-2" 
            onClick={() => onBuy(listing)}
            disabled={isBuying}
          >
            {isBuying ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Buy
              </>
            )}
          </Button>
        </div>
      </div>
    </GlowCard>
  );
};