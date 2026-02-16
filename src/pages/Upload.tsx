import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageTransition from '@/components/PageTransition';
import GlowCard from '@/components/GlowCard';
import { isNovaConfigured } from '@/services/novaService';
import { uploadAndCreateListing, CombinedUploadResult, CombinedUploadProgress } from '@/services/combinedUploadService';
import { toast } from 'sonner';
import { useNearWallet } from 'near-connect-hooks';
import CreateListing from '@/components/CreateListing';

const Upload = () => {
  const { callFunction, signedAccountId } = useNearWallet();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [assetType, setAssetType] = useState<'Image' | 'Dataset' | 'Audio' | 'Other'>('Image');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<CombinedUploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<CombinedUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadResult(null);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      setError(null);
    }
  }, []);

  const handleUpload = async () => {
    //
    if (!file || !price.trim()) {
      toast.error('Please select a file and enter a price');
      return;
    }

    if (!signedAccountId) {
      toast.error('Please connect your NEAR wallet first');
      return;
    }

    // Check if NOVA credentials are configured for this wallet
    if (!isNovaConfigured(signedAccountId)) {
      setError('NOVA credentials not configured. Please set up your NOVA account using the "Setup NOVA" button in the navigation bar.');
      toast.error('Please configure your NOVA credentials first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(null);
    setUploadResult(null);

    try {
      const result = await uploadAndCreateListing(
        file,
        assetType,
        parseInt(price),
        signedAccountId,
        callFunction,
        (progress) => {
          setUploadProgress(progress);
          
          // Show toast for each step
          switch (progress.step) {
            case 'registering_group':
              toast.info('Creating NOVA group...');
              break;
            case 'uploading_to_nova':
              toast.info('Uploading to IPFS...');
              break;
            case 'creating_listing':
              toast.info('Creating marketplace listing...');
              break;
            case 'complete':
              toast.success('Upload complete!');
              break;
          }
        }
      );
      
      setUploadResult(result);
      toast.success('File uploaded and listed successfully!');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
      toast.error('Upload failed: ' + e.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <PageTransition>
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Upload to <span className="text-primary">NOVA</span>
            </h1>
            <p className="text-muted-foreground">
              Encrypt and upload your files securely to IPFS via NOVA Protocol
            </p>
          </motion.div>

          {/* NOVA Setup Warning */}
          {signedAccountId && !isNovaConfigured(signedAccountId) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-500 mb-1">NOVA Credentials Required</p>
                  <p className="text-sm text-muted-foreground">
                    Before you can upload files, please configure your NOVA credentials using the "Setup NOVA" button in the navigation bar.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <GlowCard glowOnHover={false} className="mb-6">
            <div className="space-y-6">
              {/* Asset Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Select
                  value={assetType}
                  onValueChange={(value: any) => setAssetType(value)}
                  disabled={isUploading}
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
                  Type of digital asset you're uploading
                </p>
              </div>

              {/* Price Input */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (in NEAR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price (e.g., 5)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Price for your encrypted file on the marketplace
                </p>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <textarea
                  id="description"
                  placeholder="Tell buyers a little about your product or digital good"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  A short description buyers will see on the marketplace listing
                </p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    animate={{ scale: isDragging ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-full bg-primary/10 mb-4"
                  >
                    <UploadIcon className="h-8 w-8 text-primary" />
                  </motion.div>
                  <p className="text-lg font-medium mb-1">
                    {isDragging ? 'Drop your file here' : 'Drag & drop your file'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
              </div>

              {/* Selected File */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                      <File className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || !price.trim() || isUploading || !signedAccountId || !isNovaConfigured(signedAccountId)}
                className="w-full glow"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {uploadProgress?.message || 'Processing...'}
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5 mr-2" />
                    Upload & List on Marketplace
                  </>
                )}
              </Button>

              {!signedAccountId && (
                <p className="text-sm text-center text-muted-foreground">
                  Please connect your NEAR wallet to upload and list files
                </p>
              )}
              
              {signedAccountId && !isNovaConfigured(signedAccountId) && (
                <p className="text-sm text-center text-yellow-500">
                  Please configure your NOVA credentials to enable uploads
                </p>
              )}
            </div>
          </GlowCard>

          {/* Upload Result */}
          <AnimatePresence>
            {uploadResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlowCard className="mb-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Upload Successful!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your file has been encrypted, uploaded, and listed on the marketplace
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Product ID */}
                    <div className="p-3 rounded-lg bg-secondary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Product ID</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(uploadResult.productId.toString(), 'Product ID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-mono text-sm break-all">{uploadResult.productId}</p>
                    </div>

                    {/* NOVA Group ID */}
                    <div className="p-3 rounded-lg bg-secondary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">NOVA Group ID</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(uploadResult.groupId, 'Group ID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-mono text-sm break-all">{uploadResult.groupId}</p>
                    </div>

                    {/* IPFS CID */}
                    <div className="p-3 rounded-lg bg-secondary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">IPFS CID</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(uploadResult.cid, 'CID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-mono text-sm break-all">{uploadResult.cid}</p>
                    </div>

                    {/* NOVA Transaction ID */}
                    <div className="p-3 rounded-lg bg-secondary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">NOVA Transaction</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(uploadResult.trans_id, 'Transaction ID')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <a
                            href={`https://testnet.nearblocks.io/txns/${uploadResult.trans_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                      <p className="font-mono text-sm break-all">{uploadResult.trans_id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-secondary">
                        <span className="text-sm text-muted-foreground">File Size</span>
                        <p className="font-medium">{formatBytes(uploadResult.size)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <span className="text-sm text-muted-foreground">Uploaded</span>
                        <p className="font-medium">
                          {new Date(uploadResult.uploadedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Link to Marketplace */}
                    <div className="pt-4 border-t border-border">
                      <Button
                        className="w-full"
                        onClick={() => window.location.href = '/marketplace'}
                      >
                        View in Marketplace
                      </Button>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>


        </div>
      </div>
    </PageTransition>
  );
};

export default Upload;