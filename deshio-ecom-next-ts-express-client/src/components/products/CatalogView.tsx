import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { Product, Category, Meta } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import MobileFilterToggle from "@/components/products/MobileFilterToggle";
import {
  Search,
  X,
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
} from "lucide-react";

interface CatalogViewProps {
  searchParams: { [key: string]: string | string[] | undefined };
  basePath?: string;
  categorySlug?: string;
  genderFilter?: string;
  title?: string;
  subtitle?: string;
}

const SORT_OPTIONS = [
  { label: "Newest Additions", value: "-createdAt" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Highest Rated", value: "-rating" },
  { label: "Bestselling", value: "-sold" },
];

const GENDER_OPTIONS = [
  { label: "All Genders", value: "" },
  { label: "Women", value: "women" },
  { label: "Men", value: "men" },
  { label: "Unisex", value: "unisex" },
  { label: "Kids", value: "kids" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

const COLOR_OPTIONS = [
  { label: "Black", color: "#18181b" },
  { label: "White", color: "#f4f4f5" },
  { label: "Navy", color: "#1e3a8a" },
  { label: "Maroon", color: "#881337" },
  { label: "Olive", color: "#3f6212" },
  { label: "Beige", color: "#d6d3d1" },
  { label: "Blue", color: "#0284c7" },
  { label: "Gold", color: "#ca8a04" },
];

const PRICE_PRESETS = [
  { label: "Under ৳1,000", min: 0, max: 1000 },
  { label: "৳1,000 – ৳2,500", min: 1000, max: 2500 },
  { label: "৳2,500 – ৳5,000", min: 2500, max: 5000 },
  { label: "Over ৳5,000", min: 5000, max: undefined },
];

function getSingleParam(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

function buildQueryString(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined | null>
): string {
  const merged = { ...current };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === undefined || v === "") {
      delete merged[k];
    } else {
      merged[k] = v;
    }
  }
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}

async function fetchCatalogData(queryString: string): Promise<{
  products: Product[];
  meta: Meta;
}> {
  try {
    const res = await fetch(`${API_BASE}/products${queryString}`, {
      next: { revalidate: 300, tags: ["products"] },
    });
    if (!res.ok) {
      return {
        products: [],
        meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
      };
    }
    const json = await res.json();
    return {
      products: json.data || [],
      meta: json.meta || { page: 1, limit: 12, total: 0, totalPages: 0 },
    };
  } catch {
    return {
      products: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
    };
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 300, tags: ["categories"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function CatalogView({
  searchParams,
  basePath = "/products",
  categorySlug,
  genderFilter,
  title,
  subtitle,
}: CatalogViewProps) {
  // Parse incoming searchParams
  const search = getSingleParam(searchParams.search);
  const category = categorySlug || getSingleParam(searchParams.category);
  const gender = genderFilter || getSingleParam(searchParams.gender);
  const size = getSingleParam(searchParams.size);
  const color = getSingleParam(searchParams.color);
  const priceMin = getSingleParam(searchParams.priceMin);
  const priceMax = getSingleParam(searchParams.priceMax);
  const rating = getSingleParam(searchParams.rating);
  const sort = getSingleParam(searchParams.sort) || "-createdAt";
  const page = Number(getSingleParam(searchParams.page) || "1");
  const limit = 12;

  // Build clean dictionary of current active filters
  const currentFilters: Record<string, string | undefined> = {
    search,
    category,
    gender,
    size,
    color,
    priceMin,
    priceMax,
    rating,
    sort: sort !== "-createdAt" ? sort : undefined,
    page: page > 1 ? String(page) : undefined,
  };

  // Build API query string
  const apiParams = new URLSearchParams();
  if (search) apiParams.set("search", search);
  if (category) apiParams.set("category", category);
  if (gender) apiParams.set("gender", gender);
  if (size) apiParams.set("size", size);
  if (color) apiParams.set("color", color);
  if (priceMin) apiParams.set("priceMin", priceMin);
  if (priceMax) apiParams.set("priceMax", priceMax);
  if (rating) apiParams.set("rating", rating);
  if (sort) apiParams.set("sort", sort);
  apiParams.set("page", String(page));
  apiParams.set("limit", String(limit));

  const [catalogData, categories] = await Promise.all([
    fetchCatalogData(`?${apiParams.toString()}`),
    fetchCategories(),
  ]);

  const { products, meta } = catalogData;
  const currentCategory = categories.find(
    (c) => c.slug === category || c._id === category
  );

  const displayTitle =
    title ||
    (currentCategory
      ? currentCategory.name
      : gender
      ? `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s Wardrobe`
      : "The Fashion Catalog");

  const displaySubtitle =
    subtitle ||
    (currentCategory?.description
      ? currentCategory.description
      : "Discover bespoke silhouettes, breathable organic cottons, and timeless seasonal edits.");

  // Helper to build crawlable URLs
  const getFilterUrl = (overrides: Record<string, string | undefined | null>) =>
    `${basePath}${buildQueryString(currentFilters, { ...overrides, page: null })}`;

  const getPageUrl = (targetPage: number) =>
    `${basePath}${buildQueryString(currentFilters, { page: String(targetPage) })}`;

  // Count active filters (excluding default sort & page)
  const activeCount = [
    search,
    category && !categorySlug ? category : null,
    gender && !genderFilter ? gender : null,
    size,
    color,
    priceMin || priceMax ? true : null,
    rating,
  ].filter(Boolean).length;

  // Sidebar Filter Form markup (reused on Desktop and Mobile Drawer)
  const renderFilterPanel = () => (
    <div className="space-y-6">
      {/* 1. Category Filter */}
      {!categorySlug && (
        <div className="space-y-2 pb-5 border-b border-stone-200">
          <h4 className="text-xs uppercase font-bold tracking-wider text-stone-700">
            Departments
          </h4>
          <ul className="space-y-1 text-xs">
            <li>
              <Link
                href={getFilterUrl({ category: null })}
                className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                  !category
                    ? "bg-stone-900 text-white font-medium"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                All Departments
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c._id}>
                <Link
                  href={getFilterUrl({ category: c.slug || c._id })}
                  className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                    category === c.slug || category === c._id
                      ? "bg-stone-900 text-white font-medium"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Gender Filter */}
      {!genderFilter && (
        <div className="space-y-2 pb-5 border-b border-stone-200">
          <h4 className="text-xs uppercase font-bold tracking-wider text-stone-700">
            Silhouette / Gender
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {GENDER_OPTIONS.map((g) => (
              <Link
                key={g.value}
                href={getFilterUrl({ gender: g.value || null })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  (gender || "") === g.value
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sizes Filter */}
      <div className="space-y-2 pb-5 border-b border-stone-200">
        <h4 className="text-xs uppercase font-bold tracking-wider text-stone-700">
          Size
        </h4>
        <div className="grid grid-cols-3 gap-1.5">
          {SIZE_OPTIONS.map((sz) => (
            <Link
              key={sz}
              href={getFilterUrl({ size: size === sz ? null : sz })}
              className={`py-1.5 text-center rounded-md text-xs font-medium border transition-colors ${
                size === sz
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
              }`}
            >
              {sz}
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Color Palette */}
      <div className="space-y-2 pb-5 border-b border-stone-200">
        <h4 className="text-xs uppercase font-bold tracking-wider text-stone-700">
          Color
        </h4>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((cl) => {
            const isSelected = color?.toLowerCase() === cl.label.toLowerCase();
            return (
              <Link
                key={cl.label}
                href={getFilterUrl({ color: isSelected ? null : cl.label })}
                title={cl.label}
                className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                  isSelected
                    ? "border-stone-900 bg-stone-100 font-semibold"
                    : "border-stone-200 hover:border-stone-400"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-stone-300"
                  style={{ backgroundColor: cl.color }}
                />
                <span className="text-stone-700">{cl.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Price Filter */}
      <div className="space-y-3 pb-5 border-b border-stone-200">
        <h4 className="text-xs uppercase font-bold tracking-wider text-stone-700">
          Price Range
        </h4>
        <ul className="space-y-1 text-xs">
          {PRICE_PRESETS.map((p) => {
            const isMatch =
              String(p.min) === (priceMin || "0") &&
              (p.max === undefined ? !priceMax : String(p.max) === priceMax);
            return (
              <li key={p.label}>
                <Link
                  href={getFilterUrl({
                    priceMin: isMatch ? null : String(p.min),
                    priceMax: isMatch ? null : p.max !== undefined ? String(p.max) : null,
                  })}
                  className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                    isMatch
                      ? "bg-stone-900 text-white font-medium"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {p.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Custom Price GET form */}
        <form method="GET" action={basePath} className="pt-2">
          {/* Preserve existing query parameters */}
          {search && <input type="hidden" name="search" value={search} />}
          {category && <input type="hidden" name="category" value={category} />}
          {gender && <input type="hidden" name="gender" value={gender} />}
          {size && <input type="hidden" name="size" value={size} />}
          {color && <input type="hidden" name="color" value={color} />}
          {sort && sort !== "-createdAt" && (
            <input type="hidden" name="sort" value={sort} />
          )}

          <div className="flex items-center gap-2">
            <input
              type="number"
              name="priceMin"
              defaultValue={priceMin ?? ""}
              placeholder="Min ৳"
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-300 focus:outline-stone-800"
            />
            <span className="text-stone-400 text-xs">–</span>
            <input
              type="number"
              name="priceMax"
              defaultValue={priceMax ?? ""}
              placeholder="Max ৳"
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-300 focus:outline-stone-800"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-stone-900 text-white text-xs font-medium hover:bg-stone-800"
            >
              Go
            </button>
          </div>
        </form>
      </div>

      {/* 6. Rating */}
      <div className="space-y-2 pb-5 border-b border-stone-200">
        <h4 className="text-xs uppercase font-bold tracking-wider text-stone-700">
          Rating
        </h4>
        <div className="space-y-1 text-xs">
          {[4, 3].map((r) => {
            const isMatch = rating === String(r);
            return (
              <Link
                key={r}
                href={getFilterUrl({ rating: isMatch ? null : String(r) })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                  isMatch
                    ? "bg-stone-900 text-white font-medium"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isMatch ? "fill-amber-300 text-amber-300" : "fill-amber-400 text-amber-400"
                  }`}
                />
                <span>{r} Stars & above</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Clear All Link */}
      {activeCount > 0 && (
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 font-medium py-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50/40">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-stone-400 mb-3">
            <Link href="/" className="hover:text-stone-700 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-stone-700 transition-colors">
              Catalog
            </Link>
            {currentCategory && (
              <>
                <span>/</span>
                <span className="text-stone-700">{currentCategory.name}</span>
              </>
            )}
            {gender && (
              <>
                <span>/</span>
                <span className="text-stone-700 capitalize">{gender}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">
                {displayTitle}
              </h1>
              <p className="text-stone-500 text-sm sm:text-base mt-2 max-w-2xl font-light">
                {displaySubtitle}
              </p>
            </div>

            {/* Native Search Form */}
            <form method="GET" action={basePath} className="relative w-full lg:max-w-xs">
              {category && <input type="hidden" name="category" value={category} />}
              {gender && <input type="hidden" name="gender" value={gender} />}
              {sort && sort !== "-createdAt" && (
                <input type="hidden" name="sort" value={sort} />
              )}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search collection, fabric, style…"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-stone-300 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/50"
              />
              {search && (
                <Link
                  href={getFilterUrl({ search: null })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800"
                >
                  <X className="w-3.5 h-3.5" />
                </Link>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Sort ───────────────────────────────────────── */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Mobile Filter Button */}
          <MobileFilterToggle activeCount={activeCount}>
            {renderFilterPanel()}
          </MobileFilterToggle>

          {/* Result Count */}
          <div className="text-xs text-stone-500 font-light">
            Showing{" "}
            <span className="font-medium text-stone-800">
              {meta.total === 0 ? 0 : (page - 1) * limit + 1}–
              {Math.min(page * limit, meta.total)}
            </span>{" "}
            of <span className="font-medium text-stone-800">{meta.total}</span> pieces
          </div>

          {/* Sort Selector via Links */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-stone-500 hidden sm:inline">Sort:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {SORT_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={getFilterUrl({ sort: opt.value })}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
                    sort === opt.value
                      ? "bg-stone-900 text-white font-medium"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeCount > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
              Active:
            </span>
            {search && (
              <Link
                href={getFilterUrl({ search: null })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 hover:bg-stone-200"
              >
                <span>&ldquo;{search}&rdquo;</span>
                <X className="w-3 h-3 text-stone-500" />
              </Link>
            )}
            {category && !categorySlug && (
              <Link
                href={getFilterUrl({ category: null })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 hover:bg-stone-200"
              >
                <span>{currentCategory?.name || category}</span>
                <X className="w-3 h-3 text-stone-500" />
              </Link>
            )}
            {gender && !genderFilter && (
              <Link
                href={getFilterUrl({ gender: null })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 hover:bg-stone-200 capitalize"
              >
                <span>{gender}</span>
                <X className="w-3 h-3 text-stone-500" />
              </Link>
            )}
            {size && (
              <Link
                href={getFilterUrl({ size: null })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 hover:bg-stone-200"
              >
                <span>Size: {size}</span>
                <X className="w-3 h-3 text-stone-500" />
              </Link>
            )}
            {color && (
              <Link
                href={getFilterUrl({ color: null })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 hover:bg-stone-200"
              >
                <span>Color: {color}</span>
                <X className="w-3 h-3 text-stone-500" />
              </Link>
            )}
            {(priceMin || priceMax) && (
              <Link
                href={getFilterUrl({ priceMin: null, priceMax: null })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 hover:bg-stone-200"
              >
                <span>
                  ৳{priceMin || 0} – {priceMax ? `৳${priceMax}` : "∞"}
                </span>
                <X className="w-3 h-3 text-stone-500" />
              </Link>
            )}
            {rating && (
              <Link
                href={getFilterUrl({ rating: null })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 hover:bg-stone-200"
              >
                <span>★ {rating}+</span>
                <X className="w-3 h-3 text-stone-500" />
              </Link>
            )}
            <Link
              href={basePath}
              className="text-xs text-rose-700 hover:text-rose-900 font-medium ml-2"
            >
              Clear All
            </Link>
          </div>
        )}
      </div>

      {/* ── Main Catalog Grid & Sidebar ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex gap-10 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-xl border border-stone-200 shadow-xs sticky top-36">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
              <h3 className="font-serif font-bold text-base text-stone-900">Filters</h3>
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeCount}
                </span>
              )}
            </div>
            {renderFilterPanel()}
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-stone-200 p-8">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 mb-4">
                  <PackageOpen className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl text-stone-900 font-medium">
                  No matching garments found
                </h3>
                <p className="text-stone-500 text-sm mt-1 max-w-md mx-auto font-light">
                  We could not find any items matching your selected criteria. Try adjusting your filters or search keywords.
                </p>
                <div className="mt-6">
                  <Link
                    href={basePath}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* STRICTLY SINGLE COLUMN ON MOBILE (<640px) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* ── Pagination ────────────────────────────────────────── */}
                {meta.totalPages > 1 && (
                  <div className="mt-12 pt-6 border-t border-stone-200 flex items-center justify-between gap-4">
                    <Link
                      href={getPageUrl(Math.max(1, page - 1))}
                      aria-disabled={page <= 1}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-stone-300 transition-colors ${
                        page <= 1
                          ? "pointer-events-none opacity-40 bg-stone-100 text-stone-400"
                          : "bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => {
                        const isCurrent = p === page;
                        return (
                          <Link
                            key={p}
                            href={getPageUrl(p)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                              isCurrent
                                ? "bg-stone-900 text-white font-bold"
                                : "text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200"
                            }`}
                          >
                            {p}
                          </Link>
                        );
                      })}
                    </div>

                    <Link
                      href={getPageUrl(Math.min(meta.totalPages, page + 1))}
                      aria-disabled={page >= meta.totalPages}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-stone-300 transition-colors ${
                        page >= meta.totalPages
                          ? "pointer-events-none opacity-40 bg-stone-100 text-stone-400"
                          : "bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
