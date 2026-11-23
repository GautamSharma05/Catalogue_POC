import { NavLink, Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';

import { useCategoriesQuery } from '../queries/catalogue.queries';
import { cn } from '@/lib/utils';

const VIEWPORT_CATEGORIES = 3;

/**
 * Persistent, always-visible category navigation. Shows the first N
 * categories that fit in the viewport, plus a "See all" link to the full
 * category discovery page.
 *
 * Reachable from every page (it lives in the app header), which is the
 * point: it's the one route back to category browsing from a search
 * result, a product detail page, or a 404 - not just from the home page.
 *
 * Renders nothing while loading or on error - secondary nav, not primary
 * content, so staying quiet is better than drawing attention to a nav
 * that can't populate itself.
 */
export function CategoryNav() {
  const { data: categories, status } = useCategoriesQuery();

  if (status !== 'success' || categories.length === 0) {
    return null;
  }

  const visibleCategories = categories.slice(0, VIEWPORT_CATEGORIES);
  const hasMore = categories.length > VIEWPORT_CATEGORIES;

  return (
    <nav aria-label="Product categories" className="relative border-t">
      <div
        className="mx-auto flex max-w-[1140px] items-center gap-2 overflow-x-auto px-5 py-2 [scrollbar-width:none]"
        style={{
          maskImage: 'linear-gradient(to right, black calc(100% - 28px), transparent)',
        }}
      >
        {visibleCategories.map((category, index) => (
          <NavLink
            key={category}
            to={`/categories/${encodeURIComponent(category)}`}
            className={({ isActive }) =>
              cn(
                'shrink-0 rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium capitalize text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                // Three pills plus "See all" is tight on a phone screen -
                // keep the first two always visible and only show the
                // third once there's room (sm breakpoint and up).
                index === 2 && 'hidden sm:inline-flex',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
              )
            }
          >
            {category}
          </NavLink>
        ))}
        {hasMore && (
          <Link
            to="/categories"
            className="ml-1 flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-accent px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            See all
            <ArrowRightIcon className="size-3.5" />
          </Link>
        )}
      </div>
    </nav>
  );
}
