import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageTransition from '@/components/PageTransition';
import GlowCard from '@/components/GlowCard';
import { uploadFile, registerGroup, isNovaConfigured, UploadResult } from '@/services/novaService';
import { toast } from 'sonner';
import CreateListing from '@/components/CreateListing';

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [groupId, setGroupId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
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
    if (!file || !groupId.trim()) {
      toast.error('Please select a file and enter a group ID');
      return;
    }

    if (!isNovaConfigured()) {
      setError('NOVA credentials not configured. Please set VITE_NOVA_ACCOUNT_ID and VITE_NOVA_API_KEY in your environment.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Try to create group first (might already exist)
      try {
        await registerGroup(groupId.trim());
        toast.success('Group created successfully');
      } catch (e: any) {
        if (!e.message?.includes('exists') && !e.message?.includes('already')) {
          console.log('Group may already exist, continuing...');
        }
      }

      // Read file as buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to NOVA
      const result = await uploadFile(groupId.trim(), buffer, file.name);
      setUploadResult(result);
      toast.success('File uploaded successfully!');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
      toast.error('Upload failed: ' + e.message);
    } finally {
      setIsUploading(false);
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

          <GlowCard glowOnHover={false} className="mb-6">
            <div className="space-y-6">
              {/* Group ID Input */}
              <div className="space-y-2">
                <Label htmlFor="groupId">Group ID</Label>
                <Input
                  id="groupId"
                  placeholder="Enter group ID (e.g., my-digital-art)"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  A group controls access to your files. Create a new one or use an existing group.
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
                disabled={!file || !groupId.trim() || isUploading}
                className="w-full glow"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Encrypting & Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Upload to NOVA
                  </>
                )}
              </Button>
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
                        Your file has been encrypted and stored
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
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

                    <div className="p-3 rounded-lg bg-secondary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Transaction ID</span>
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
                  </div>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Listing Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CreateListing 
              uploadedCid={uploadResult?.cid}
              uploadedGroupId={groupId}
            />
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Upload;