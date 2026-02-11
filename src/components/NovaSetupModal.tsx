import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Key, 
  UserCircle, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  saveNovaCredentials,
  getNovaCredentials,
  deleteNovaCredentials,
  validateNovaCredentials,
  NovaCredentials,
} from '@/services/novaCredentialsService';
import { toast } from 'sonner';

interface NovaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  nearWallet: string;
  onCredentialsSaved?: () => void;
}

const NovaSetupModal = ({ 
  isOpen, 
  onClose, 
  nearWallet,
  onCredentialsSaved 
}: NovaSetupModalProps) => {
  const [accountId, setAccountId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && nearWallet) {
      loadExistingCredentials();
    }
  }, [isOpen, nearWallet]);

  const loadExistingCredentials = () => {
    const existing = getNovaCredentials(nearWallet);
    if (existing) {
      setHasExisting(true);
      // Show masked credentials
      setAccountId(existing.accountId);
      setApiKey('••••••••••••••••'); // Masked
    } else {
      setHasExisting(false);
      setAccountId('');
      setApiKey('');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!accountId.trim() || !apiKey.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const credentials: NovaCredentials = {
      accountId: accountId.trim(),
      apiKey: apiKey.trim(),
    };

    if (!validateNovaCredentials(credentials)) {
      toast.error('Invalid credentials format. Account ID should end with .nova-sdk.near and API key should start with nova_sk_');
      return;
    }

    setIsLoading(true);
    try {
      // Save encrypted credentials
      saveNovaCredentials(nearWallet, credentials);
      
      toast.success('NOVA credentials saved securely!');
      
      // Trigger callback
      onCredentialsSaved?.();
      
      // Close modal
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      toast.error('Failed to save credentials: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete your NOVA credentials? You will need to set them up again.')) {
      return;
    }

    try {
      deleteNovaCredentials(nearWallet);
      toast.success('NOVA credentials deleted');
      setHasExisting(false);
      setAccountId('');
      setApiKey('');
      setIsEditing(false);
    } catch (error: any) {
      toast.error('Failed to delete credentials: ' + error.message);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowCredentials(true);
    // Load actual credentials for editing
    const existing = getNovaCredentials(nearWallet);
    if (existing) {
      setAccountId(existing.accountId);
      setApiKey(existing.apiKey);
    }
  };

  const handleCancel = () => {
    if (hasExisting && !isEditing) {
      onClose();
    } else {
      setIsEditing(false);
      loadExistingCredentials();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Gradient Header */}
          <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 -mt-16">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-background border border-border shadow-lg">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2">
              {hasExisting && !isEditing ? 'NOVA Credentials' : 'Setup NOVA Account'}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              {hasExisting && !isEditing 
                ? 'Manage your encrypted NOVA credentials'
                : 'Connect your NOVA account to unlock encrypted file storage'
              }
            </p>

            {/* Connected Wallet Info */}
            <div className="mb-6 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <UserCircle className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Connected Wallet:</span>
                <span className="font-mono font-semibold flex-1 truncate">{nearWallet}</span>
              </div>
            </div>

            {/* Form or Display */}
            {hasExisting && !isEditing ? (
              // Display existing credentials (masked)
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-500 mb-1">Credentials Configured</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your NOVA credentials are securely stored and encrypted in your browser.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Account ID:</span>
                          <span className="font-mono text-xs">{accountId}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">API Key:</span>
                          <span className="font-mono text-xs">••••••••••••••••</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              // Form for new/editing credentials
              <>
                {/* Instructions */}
                <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Don't have a NOVA account? Create one to access encrypted file storage:
                      </p>
                      <a
                        href="https://nova-sdk.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        Visit nova-sdk.com
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="accountId" className="flex items-center gap-2 mb-2">
                      <UserCircle className="h-4 w-4 text-primary" />
                      NOVA Account ID
                    </Label>
                    <Input
                      id="accountId"
                      type="text"
                      placeholder="yourname.nova-sdk.near"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="font-mono"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must end with .nova-sdk.near
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="apiKey" className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-primary" />
                      NOVA API Key
                    </Label>
                    <Input
                      id="apiKey"
                      type={showCredentials ? "text" : "password"}
                      placeholder="nova_sk_xxxxxxxxxxxxx"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono"
                      disabled={isLoading}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        Must start with nova_sk_
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCredentials(!showCredentials)}
                        className="text-xs text-primary hover:underline"
                      >
                        {showCredentials ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mb-6 p-3 rounded-lg bg-secondary/50 border border-border/50">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Your credentials are encrypted and stored locally in your browser. They are linked to your NEAR wallet and will be automatically loaded when you connect.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NovaSetupModal;