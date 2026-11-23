import { Route, Routes } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';

import { SearchBar } from './components/SearchBar';
import { CategoryNav } from './components/CategoryNav';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { ProductPage } from './pages/ProductPage';

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1140px] items-center gap-5 px-5 py-3">
          <a href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight whitespace-nowrap">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-primary text-sm font-semibold text-primary-foreground">
              C
            </span>
            <span>Catalogue</span>
          </a>
          <SearchBar />
        </div>
        <CategoryNav />
      </header>

      <main className="mx-auto w-full max-w-[1140px] flex-1 px-5 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="mx-auto w-full max-w-[1140px] border-t px-5 py-5 text-sm text-muted-foreground">
        <p>&copy; 2026 Catalogue. All rights reserved.</p>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/60 px-6 py-12 text-center">
      <SearchIcon className="size-8 text-muted-foreground" />
      <p className="text-lg text-muted-foreground">Page not found</p>
    </div>
  );
}
