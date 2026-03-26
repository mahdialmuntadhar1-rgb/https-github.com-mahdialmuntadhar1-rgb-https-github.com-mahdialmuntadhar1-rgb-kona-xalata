import React, { useEffect, useRef, useState } from 'react';
import type { Category, Subcategory } from '../types';
import { X, ChevronDown, Grid3x3 } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';

interface SubcategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSubcategorySelect: (category: Category, subcategory: Subcategory) => void;
}

const AccordionItem: React.FC<{
  key?: string | number;
  group: Subcategory,
  category: Category,
  onSubcategorySelect: (category: Category, subcategory: Subcategory) => void,
}> = ({ group, category, onSubcategorySelect }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslations();
  
  return (
     <div className="border-b border-white/10 last:border-b-0">
        <button 
          className="w-full flex justify-between items-center py-4 text-start rtl:text-right"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{group.icon}</span>
            <span className="font-semibold text-white">{t(group.nameKey)}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
             {group.subcategories?.map((sub) => (
              <GlassCard
                as="button"
                key={sub.id}
                onClick={() => onSubcategorySelect(category, sub)}
                className="group relative p-4 hover:shadow-[0_0_20px_rgba(108,43,217,0.3)] hover:-translate-y-1 hover:scale-105"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {sub.icon}
                </div>
                <h4 className="text-white font-medium text-xs text-center">
                  {t(sub.nameKey)}
                </h4>
                <p className="text-white/50 text-xs text-center mt-1">
                  {sub.count} {t('items')}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
  )
}


export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({ category, onClose, onSubcategorySelect }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslations();

  useEffect(() => {
    if (category) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [category, onClose]);
  
  if (!category || !category.subcategories || category.subcategories.length === 0) {
    return null;
  }

  const handleSubcategoryClick = (cat: Category, sub: Subcategory) => {
    if (!sub.subcategories || sub.subcategories.length === 0) {
        onSubcategorySelect(cat, sub);
        onClose();
    }
  };

  const titleId = `subcategory-modal-title-${category.id}`;
  const descriptionId = `subcategory-modal-description-${category.id}`;
  
  const hasNestedSubcategories = category.subcategories.some(sub => sub.subcategories && sub.subcategories.length > 0);
  
  const allSubcategoryOption: Subcategory = {
    id: `${category.id}-all`,
    icon: <Grid3x3 />,
    nameKey: 'subcategories.all',
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />
      <div 
        ref={modalRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide p-4 md:p-8 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div className="backdrop-blur-2xl bg-dark-bg/90 border border-white/20 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(108,43,217,0.3)] transition-all duration-300 transform scale-95 opacity-0 animate-scale-in">
          <style>{`
            @keyframes scale-in {
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            .animate-scale-in {
              animation: scale-in 0.3s forwards;
            }
          `}</style>
          <div className="flex items-start md:items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{category.icon}</div>
              <div className="text-start rtl:text-right">
                <h3 id={titleId} className="text-2xl font-bold text-white">
                  {t(category.nameKey)}
                </h3>
                <p id={descriptionId} className="text-white/60 text-sm">
                  {t('subcategories.selectOne')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close subcategory modal"
              className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all duration-200 flex-shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {hasNestedSubcategories ? (
            <div className="space-y-2">
                <div className="border-b border-primary/50">
                    <button 
                        className="w-full flex justify-between items-center py-4 text-start rtl:text-right"
                        onClick={() => handleSubcategoryClick(category, allSubcategoryOption)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl text-primary"><Grid3x3/></span>
                            <span className="font-semibold text-primary">{t('subcategories.all')} {t(category.nameKey)}</span>
                        </div>
                    </button>
                </div>
              {category.subcategories?.map((group) => (
                <AccordionItem 
                  key={group.id} 
                  group={group}
                  category={category}
                  onSubcategorySelect={(cat, sub) => {
                    onSubcategorySelect(cat, sub);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <GlassCard
                  as="button"
                  onClick={() => handleSubcategoryClick(category, allSubcategoryOption)}
                  className="group relative p-6 hover:shadow-[0_0_20px_rgba(108,43,217,0.3)] hover:-translate-y-1 hover:scale-105 border-primary/50"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform text-primary">
                    {allSubcategoryOption.icon}
                  </div>
                  <h4 className="text-primary font-semibold text-sm text-center">
                    {t(allSubcategoryOption.nameKey)} {t(category.nameKey)}
                  </h4>
                </GlassCard>
              {category.subcategories?.map((sub) => (
                <GlassCard
                  as="button"
                  key={sub.id}
                  onClick={() => handleSubcategoryClick(category, sub)}
                  className="group relative p-6 hover:shadow-[0_0_20px_rgba(108,43,217,0.3)] hover:-translate-y-1 hover:scale-105"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {sub.icon}
                  </div>
                  <h4 className="text-white font-medium text-sm text-center">
                    {t(sub.nameKey)}
                  </h4>
                  {sub.count && (
                    <p className="text-white/50 text-xs text-center mt-1">
                      {sub.count} {t('items')}
                    </p>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
};
