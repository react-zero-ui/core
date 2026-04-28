export type Category = 'electronics' | 'books' | 'clothing';

export type Product = {
  id: number;
  name: string;
  category: Category;
  price: number;
};

export const categories: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'books', label: 'Books' },
  { value: 'clothing', label: 'Clothing' },
];

export const products: Product[] = [
  { id: 1, name: 'Laptop Pro 14"', category: 'electronics', price: 1299 },
  { id: 2, name: 'Noise-cancelling Headphones', category: 'electronics', price: 299 },
  { id: 3, name: 'Wireless Mouse', category: 'electronics', price: 49 },
  { id: 4, name: '4K Monitor', category: 'electronics', price: 449 },
  { id: 5, name: 'Mechanical Keyboard', category: 'electronics', price: 129 },
  { id: 6, name: 'The Pragmatic Programmer', category: 'books', price: 32 },
  { id: 7, name: 'Designing Data-Intensive Apps', category: 'books', price: 45 },
  { id: 8, name: 'Refactoring', category: 'books', price: 38 },
  { id: 9, name: 'Clean Code', category: 'books', price: 29 },
  { id: 10, name: 'Merino Wool Sweater', category: 'clothing', price: 89 },
  { id: 11, name: 'Selvedge Denim Jeans', category: 'clothing', price: 145 },
  { id: 12, name: 'Leather Boots', category: 'clothing', price: 220 },
  { id: 13, name: 'Oxford Shirt', category: 'clothing', price: 68 },
  { id: 14, name: 'Wool Overcoat', category: 'clothing', price: 320 },
];

export async function fetchWithDelay(query: string, category: Category | 'all'): Promise<Product[]> {
  await new Promise((r) => setTimeout(r, 650));
  const q = query.trim().toLowerCase();
  return products.filter(
    (p) => (category === 'all' || p.category === category) && (q === '' || p.name.toLowerCase().includes(q))
  );
}
