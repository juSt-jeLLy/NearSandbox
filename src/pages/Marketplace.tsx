import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, Lock, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageTransition from '@/components/PageTransition';
import GlowCard from '@/components/GlowCard';

// Mock marketplace items (in real app, would come from NOVA transactions)
const mockItems = [
  {
    id: '1',
    name: 'Digital Art Collection #1',
    description: 'A stunning collection of abstract digital artwork',
    cid: 'QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy',
    groupId: 'art-collection',
    size: 2500000,
    uploadedAt: '2024-01-15T10:30:00Z',
    type: 'image',
  },
  {
    id: '2',
    name: 'AI Training Dataset',
    description: 'Curated dataset for machine learning models',
    cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    groupId: 'ml-datasets',
    size: 15000000,
    uploadedAt: '2024-01-14T15:45:00Z',
    type: 'dataset',
  },
  {
    id: '3',
    name: 'Premium Music Pack',
    description: 'High-quality royalty-free music tracks',
    cid: 'QmZTR5bcpQD7cFgTorqxZDYaew1Wqgfbd2ud9QqGPAkK2V',
    groupId: 'music-assets',
    size: 8500000,
    uploadedAt: '2024-01-13T09:20:00Z',
    type: 'audio',
  },
  {
    id: '4',
    name: '3D Model Assets',
    description: 'Professional 3D models for game development',
    cid: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB',
    groupId: '3d-models',
    size: 45000000,
    uploadedAt: '2024-01-12T14:00:00Z',
    type: 'model',
  },
  {
    id: '5',
    name: 'Research Documents',
    description: 'Encrypted research papers and findings',
    cid: 'QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J7s9r41xu1mf8',
    groupId: 'research',
    size: 3200000,
    uploadedAt: '2024-01-11T11:15:00Z',
    type: 'document',
  },
  {
    id: '6',
    name: 'NFT Art Series',
    description: 'Exclusive digital art pieces with provenance',
    cid: 'QmUSzqWABsJZ3ChXeQVzCQR8HBQrPDrRD5kNGJNvKfQFL4',
    groupId: 'nft-art',
    size: 5600000,
    uploadedAt: '2024-01-10T16:30:00Z',
    type: 'image',
  },
];

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

  const filteredItems = mockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      image: 'bg-blue-500/10 text-blue-400',
      dataset: 'bg-purple-500/10 text-purple-400',
      audio: 'bg-pink-500/10 text-pink-400',
      model: 'bg-orange-500/10 text-orange-400',
      document: 'bg-cyan-500/10 text-cyan-400',
    };
    return colors[type] || 'bg-primary/10 text-primary';
  };

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
              Browse and access encrypted digital assets securely
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
                placeholder="Search assets..."
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

          {/* Items Grid/List */}
          {viewMode === 'grid' ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <GlowCard className="h-full">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span
                            className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(
                              item.type
                            )} mb-2`}
                          >
                            {item.type}
                          </span>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Lock className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatBytes(item.size)}</span>
                        <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                      </div>

                      {/* CID Preview */}
                      <div className="p-2 rounded-lg bg-secondary">
                        <p className="font-mono text-xs text-muted-foreground truncate">
                          {item.cid}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1 gap-2">
                          <Download className="h-4 w-4" />
                          Access
                        </Button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <GlowCard>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${getTypeColor(
                              item.type
                            )}`}
                          >
                            {item.type}
                          </span>
                          <Lock className="h-3 w-3 text-primary" />
                        </div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatBytes(item.size)}</span>
                        <span className="hidden md:inline">
                          {new Date(item.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Access
                        </Button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="p-4 rounded-full bg-secondary inline-block mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Marketplace;
