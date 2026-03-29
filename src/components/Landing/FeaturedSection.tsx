import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight } from 'lucide-react';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface FeaturedSectionProps {
  places: Place[];
}

export function FeaturedSection({ places }: FeaturedSectionProps) {
  const featured = places.filter((p) => p.rating >= 5).slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-5 md:px-8 py-20">
      {/* Section header */}
      <div className="text-center mb-14">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--sg-crimson)] mb-3">
          Featured Places
        </h2>
        <p className="text-[var(--sg-navy)]/60 text-lg">Our top picks across London</p>
        <div className="section-divider mt-6">
          <div className="dot" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featured.map((place, i) => {
          const cat = CATEGORIES.find((c) => c.value === place.category);
          return (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: 'easeOut' }}
            >
              <Link to={`/place/${place.id}`} className="im-card block p-7 group">
                {/* Icon + meta */}
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ backgroundColor: `${cat?.color}25` }}
                  >
                    {CATEGORY_EMOJI[place.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--sg-navy)] group-hover:text-[var(--sg-crimson)]
                      transition-colors leading-snug">
                      {place.name}
                    </h3>
                    <span
                      className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1.5"
                      style={{ backgroundColor: `${cat?.color}12`, color: cat?.color }}
                    >
                      {cat?.label}
                    </span>
                  </div>
                  <ArrowUpRight size={18} className="text-[var(--sg-border)] group-hover:text-[var(--sg-thames)]
                    transition-colors shrink-0 mt-1" />
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--sg-navy)]/60 line-clamp-3 leading-relaxed mb-5">
                  {place.description}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 pt-4 border-t border-[var(--sg-border)]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className={j < place.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-[var(--sg-border)]'}
                    />
                  ))}
                  <span className="text-xs text-[var(--sg-navy)]/40 ml-2">
                    {place.rating}.0
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
