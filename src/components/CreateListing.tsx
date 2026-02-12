import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlowCard from '@/components/GlowCard';
import { useNearWallet } from 'near-connect-hooks';
import { toast } from 'sonner';

const MARKETPLACE_CONTRACT = 'busyward7488.near';

interface CreateListingProps {
  uploadedCid?: string;
  uploadedGroupId?: string;
}

const CreateListing = ({ uploadedCid, uploadedGroupId }: CreateListingProps) => {
  const { callFunction, signedAccountId } = useNearWallet();
  
  const [formData, setFormData] = useState({
    productId: '1001',  // Pre-filled test data
    price: '5',         // Pre-filled test data
    novaGroupId: 'test_image_group_001',  // Pre-filled test data
    listType: 'Image' as 'Image' | 'Dataset' | 'Audio' | 'Other',
    cid: 'QmTestCID123456789abcdef',  // Pre-filled test CID
    gpOwner: '',  // Will be filled with connected wallet
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update gpOwner when wallet connects
  useEffect(() => {
    if (signedAccountId) {
      setFormData(prev => ({ ...prev, gpOwner: signedAccountId }));
    }
  }, [signedAccountId]);

  // Update form when upload data is provided
  useEffect(() => {
    if (uploadedCid || uploadedGroupId) {
      setFormData(prev => ({
        ...prev,
        cid: uploadedCid || prev.cid,
        novaGroupId: uploadedGroupId || prev.novaGroupId,
      }));
    }
  }, [uploadedCid, uploadedGroupId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleCreateListing = async () => {
    // Validation
    if (!formData.productId || !formData.price || !formData.novaGroupId || !formData.cid || !formData.gpOwner) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!signedAccountId) {
      toast.error('Please connect your NEAR wallet first');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Creating listing with args:', {
        product_id: parseInt(formData.productId),
        price: parseInt(formData.price),
        nova_group_id: formData.novaGroupId,
        list_type: formData.listType,
        cid: formData.cid,
        gp_owner: formData.gpOwner,
        is_tee_verified: false,
        tee_signature: null,
      });

      // Call the create_listing function on the contract
      await callFunction({
        contractId: MARKETPLACE_CONTRACT,
        method: 'create_listing',
        args: {
          product_id: parseInt(formData.productId),
          price: parseInt(formData.price),
          nova_group_id: formData.novaGroupId,
          list_type: formData.listType,
          cid: formData.cid,
          gp_owner: formData.gpOwner,
          is_tee_verified: false,  // Required by updated contract
          tee_signature: null,     // Required by updated contract
        },
      });

      setSuccess(true);
      toast.success('Listing created successfully!');
      
      // Reset form after success (but keep test values for easy re-testing)
      setTimeout(() => {
        setFormData({
          productId: String(parseInt(formData.productId) + 1), // Increment product ID
          price: '5',
          novaGroupId: uploadedGroupId || 'test_image_group_001',
          listType: 'Image',
          cid: uploadedCid || 'QmTestCID123456789abcdef',
          gpOwner: signedAccountId || '',
        });
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      const errorMessage = err.message || 'Failed to create listing';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <GlowCard glowOnHover={false}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Create Test Listing</h3>
            <p className="text-sm text-muted-foreground">
              Pre-filled with test data - just click Create!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Product ID */}
          <div className="space-y-2">
            <Label htmlFor="productId">
              Product ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="productId"
              type="number"
              placeholder="Enter unique product ID (e.g., 1001)"
              value={formData.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for your product
            </p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Price (in NEAR) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="Enter price (e.g., 5)"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Price in NEAR tokens
            </p>
          </div>

          {/* NOVA Group ID */}
          <div className="space-y-2">
            <Label htmlFor="novaGroupId">
              NOVA Group ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="novaGroupId"
              placeholder="Enter NOVA group ID"
              value={formData.novaGroupId}
              onChange={(e) => handleInputChange('novaGroupId', e.target.value)}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              The group ID used for encryption
            </p>
          </div>

          {/* List Type */}
          <div className="space-y-2">
            <Label htmlFor="listType">
              Asset Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.listType}
              onValueChange={(value) => handleInputChange('listType', value)}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Image">Image</SelectItem>
                <SelectItem value="Dataset">Dataset</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Type of digital asset
            </p>
          </div>

          {/* IPFS CID */}
          <div className="space-y-2">
            <Label htmlFor="cid">
              IPFS CID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cid"
              placeholder="Enter IPFS content identifier"
              value={formData.cid}
              onChange={(e) => handleInputChange('cid', e.target.value)}
              disabled={isCreating}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Content identifier from IPFS upload
            </p>
          </div>

          {/* Owner Account */}
          <div className="space-y-2">
            <Label htmlFor="gpOwner">
              Owner Account <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gpOwner"
              placeholder="Enter NEAR account ID"
              value={formData.gpOwner}
              onChange={(e) => handleInputChange('gpOwner', e.target.value)}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              NEAR account that owns this listing (auto-filled from wallet)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20"
            >
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary">Test listing created successfully!</p>
            </motion.div>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreateListing}
            disabled={isCreating || !signedAccountId}
            className="w-full glow"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Listing...
              </>
            ) : (
              <>
                <Package className="h-5 w-5 mr-2" />
                Create Test Listing
              </>
            )}
          </Button>

          {!signedAccountId && (
            <p className="text-sm text-center text-muted-foreground">
              Please connect your NEAR wallet to create listings
            </p>
          )}
          
          {signedAccountId && (
            <p className="text-sm text-center text-green-500">
              ✓ Ready to create test listing for {signedAccountId}
            </p>
          )}
        </div>
      </div>
    </GlowCard>
  );
};

export default CreateListing;