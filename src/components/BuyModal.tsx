import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type OriginOption = 'op-usdc' | 'op-eth' | 'eth-eth' | 'arb-usdc' | 'arb-eth' | 'eth-usdc' | 'near-wnear';

const ORIGIN_OPTIONS: { value: OriginOption; label: string }[] = [
  { value: 'near-wnear', label: 'wNEAR on NEAR (Direct)' },
  { value: 'op-usdc', label: 'USDC on Optimism' },
  { value: 'op-eth', label: 'ETH on Optimism' },
  { value: 'eth-eth', label: 'ETH on Ethereum' },
  { value: 'arb-usdc', label: 'USDC on Arbitrum' },
  { value: 'arb-eth', label: 'ETH on Arbitrum' },
];

export interface BuyOptions {
  originBlockchain: string;
  originSymbol: string;
  refundTo: string;
}

export interface Listing {
  product_id: number;
  price: number;
  nova_group_id: string;
  owner: string;
  purchase_number: number;
  list_type: string;
  cid: string;
  is_active: boolean;
}

interface BuyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
  onConfirm: (options: BuyOptions) => void;
  isBuying?: boolean;
}

const formatPrice = (price: number): string => {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(2)} USDC`;
  return `$${(price / 100).toFixed(2)}`;
};

export function BuyModal({ open, onOpenChange, listing, onConfirm, isBuying = false }: BuyModalProps) {
  const [origin, setOrigin] = useState<OriginOption>('near-wnear');
  const [refundTo, setRefundTo] = useState('');

  const isNearDirect = origin === 'near-wnear';

  const handleConfirm = () => {
    // For NEAR direct, refundTo is not needed
    if (isNearDirect) {
      onConfirm({ 
        originBlockchain: 'near', 
        originSymbol: 'wNEAR',
        refundTo: '' // Not needed for direct NEAR transfer
      });
      onOpenChange(false);
      return;
    }

    // For cross-chain, require refund address
    if (!refundTo.trim()) return;

    const ORIGIN_MAP = {
      'op-usdc':  { originBlockchain: 'op',  originSymbol: 'USDC' },
      'op-eth':   { originBlockchain: 'op',  originSymbol: 'ETH'  },
      'eth-eth':  { originBlockchain: 'eth', originSymbol: 'ETH'  },
      'arb-usdc': { originBlockchain: 'arb', originSymbol: 'USDC' },
      'arb-eth':  { originBlockchain: 'arb', originSymbol: 'ETH'  },
      'eth-usdc': { originBlockchain: 'eth', originSymbol: 'USDC' },
    };

    const selection = ORIGIN_MAP[origin as keyof typeof ORIGIN_MAP];
    if (selection) {
      onConfirm({ 
        ...selection, 
        refundTo: refundTo.trim() 
      });
      onOpenChange(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNearDirect ? 'Pay with wNEAR on NEAR' : 'Pay with cross-chain'}
          </DialogTitle>
          <DialogDescription>
            {isNearDirect 
              ? 'Direct payment from your NEAR wallet to the seller.'
              : 'Choose your origin chain and token, and where to refund if needed. Payment will go to the listing owner on NEAR.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <p className="text-sm font-medium">Product #{listing.product_id} — {formatPrice(listing.price)}</p>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select value={origin} onValueChange={(v) => setOrigin(v as OriginOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {ORIGIN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isNearDirect && (
            <div className="space-y-2">
              <Label htmlFor="refund">Refund address (origin chain)</Label>
              <Input
                id="refund"
                placeholder="0x... or your wallet address on origin chain"
                value={refundTo}
                onChange={(e) => setRefundTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If the swap cannot be completed, funds are returned to this address.
              </p>
            </div>
          )}

          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <Label className="text-muted-foreground">
              {isNearDirect ? 'Payment Details' : 'Destination (fixed)'}
            </Label>
            {isNearDirect ? (
              <>
                <p className="text-sm font-medium">Direct NEAR transfer</p>
                <p className="text-sm font-medium">Token: wNEAR</p>
                <p className="text-sm font-medium">To: <span className="font-mono text-xs">{listing.owner}</span></p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Chain: NEAR</p>
                <p className="text-sm font-medium">Token: wNEAR</p>
                <p className="text-sm font-medium">Recipient (listing owner): <span className="font-mono text-xs">{listing.owner}</span></p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBuying}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isBuying || (!isNearDirect && !refundTo.trim())}
          >
            {isBuying ? 'Processing...' : 'Continue to payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}