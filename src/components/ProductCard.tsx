import { Lock, Download, Eye } from 'lucide-react';
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

export const ProductCard = ({ listing, onBuy, onPreview, isBuying = false }: ProductCardProps) => {
  return (
    <GlowCard className="h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span
              className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(
                listing.list_type
              )} mb-2`}
            >
              {listing.list_type}
            </span>
            <h3 className="font-semibold text-lg">Product #{listing.product_id}</h3>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
        </div>

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