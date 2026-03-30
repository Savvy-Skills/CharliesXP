import { Link } from 'react-router';
import { motion } from 'framer-motion';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface CategoryBrowseProps {
  places: Place[];
}

export function CategoryBrowse({ places }: CategoryBrowseProps) {
  const categoriesWithCount = CATEGORIES.map((cat) => ({
    ...cat,
    count: places.filter((p) => p.category === cat.value).length,
  })).filter((c) => c.count > 0);

  return (
    <section className="max-w-6xl mx-auto px-5 md:px-8 py-20">
      {/* Section header */}
      <div className="text-center mb-14">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--sg-crimson)] mb-3">
          Browse by Category
        </h2>
        <p className="text-[var(--sg-navy)]/60 text-lg">Find your next favourite spot</p>
        <div className="section-divider mt-6">
          <div className="dot" />
        </div>
      </div>

      {/* Category grid */}
      <div className="flex flex-wrap justify-center gap-5 md:gap-6">
        {categoriesWithCount.map((cat, i) => (
          <motion.div
            key={cat.value}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
          >
            <Link
              to={`/map`}
              className="im-card flex flex-col items-center gap-3 px-7 py-6
                min-w-[120px] group"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                  group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: `${cat.color}15` }}
              >
                {CATEGORY_EMOJI[cat.value]}
              </div>
              <div className="text-center">
                <span className="block text-sm font-bold text-[var(--sg-navy)]">{cat.label}</span>
                <span className="block text-xs text-[var(--sg-navy)]/40 mt-0.5">
                  {cat.count} place{cat.count !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
