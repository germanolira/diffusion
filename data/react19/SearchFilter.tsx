import { useDeferredValue, useId, useMemo, useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
}

interface SearchFilterProps {
  products: Product[];
  placeholder: string;
}

export function SearchFilter({ products, placeholder }: SearchFilterProps) {
  const [query, setQuery] = useState<string>('');
  const inputId = useId();

  // Defer heavy filter while typing stays fast.
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, deferredQuery]);

  return (
    <section>
      <h2>Search</h2>
      <label htmlFor={inputId}>Filter products</label>
      <input
        id={inputId}
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p>
        {results.length} of {products.length} shown
      </p>
      <ul>
        {results.map((p) => (
          <li key={p.id}>
            {p.name} <small>({p.category})</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
