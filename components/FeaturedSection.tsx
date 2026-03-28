import React from 'react';
import { FeaturedBusinesses } from './FeaturedBusinesses';
import { motion } from 'motion/react';

interface FeaturedSectionProps {
    selectedGovernorate: string;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ selectedGovernorate }) => {
    return (
        <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
        >
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />
            <FeaturedBusinesses selectedGovernorate={selectedGovernorate} />
        </motion.section>
    );
};
