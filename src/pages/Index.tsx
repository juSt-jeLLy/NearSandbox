import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Lock, Zap, Globe, ArrowRight, Upload, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/PageTransition';
import GlowCard from '@/components/GlowCard';

const features = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Your files are encrypted client-side with AES-256-GCM before leaving your device.',
  },
  {
    icon: Globe,
    title: 'Decentralized Storage',
    description: 'Files stored on IPFS with metadata recorded on NEAR blockchain.',
  },
  {
    icon: Shield,
    title: 'TEE Key Management',
    description: 'Keys managed in Trusted Execution Environments via Shade Agents.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed with lazy re-encryption and efficient access control.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const Index = () => {
  return (
    <PageTransition>
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">Privacy-First Marketplace</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Secure Digital
                <br />
                <span className="text-primary glow-text">Marketplace</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Trade digital goods and art with end-to-end encryption. 
                Powered by NOVA's decentralized file-sharing on NEAR Protocol.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/upload">
                  <Button size="lg" className="glow gap-2 text-lg px-8">
                    <Upload className="h-5 w-5" />
                    Upload Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                    <Store className="h-5 w-5" />
                    Browse Market
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8 border-t border-border">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Why Choose <span className="text-primary">NOVA</span>Market?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Built on cutting-edge technology for uncompromising security and privacy.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} variants={itemVariants}>
                    <GlowCard className="h-full">
                      <div className="flex flex-col items-center text-center">
                        <div className="p-3 rounded-lg bg-primary/10 mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8 border-t border-border">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {[
                { value: '256-bit', label: 'AES Encryption' },
                { value: 'IPFS', label: 'Decentralized Storage' },
                { value: 'NEAR', label: 'Blockchain' },
                { value: 'TEE', label: 'Secure Keys' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8 border-t border-border">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <GlowCard className="py-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Join the future of secure digital asset trading. 
                  Upload your first file today.
                </p>
                <Link to="/upload">
                  <Button size="lg" className="glow gap-2">
                    Start Uploading
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </GlowCard>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Index;
