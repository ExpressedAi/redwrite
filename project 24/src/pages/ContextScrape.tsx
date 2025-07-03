import React from 'react';
import { motion } from 'framer-motion';
import ContextSearch from '../components/context/ContextSearch';

const ContextScrape: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Context Scrape</h1>
        <p className="text-gray-400 mb-8">
          Extract and analyze web content using Firecrawl's powerful crawling and AI capabilities
        </p>
      </motion.div>

      <ContextSearch />
    </div>
  );
};

export default ContextScrape;