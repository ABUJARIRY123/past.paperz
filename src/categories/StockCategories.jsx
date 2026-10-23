import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, Tag, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";

const API_BASE = import.meta.env.VITE_API_BASE_URL;


export default function StockCategories() {
  const { currentUser } = useSelector((state) => state.user);

  const isAdmin = currentUser?.role === "Admin";
  const basePath = isAdmin ? "/admindashboard" : "/shopdashboard";

  const [stockCount, setStockCount] = useState(null);
  const [categoryCount, setCategoryCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories/counts`, 
            { credentials: "include" });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setStockCount(data.stockCount);
          setCategoryCount(data.categoryCount);
        }
      } catch {
        // Counts are a nice-to-have on this page; a failed fetch just
        // leaves the cards without a number rather than showing an error.
      }
    };

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = [
    {
      to: `${basePath}?tab=stock`,
      icon: Boxes,
      title: "Stock",
      description: "View inventory, adjust quantities, and add new stock items.",
      count: stockCount,
      countLabel: "products",
    },
    {
      to: `${basePath}?tab=categories`,
      icon: Tag,
      title: "Categories",
      description: "Create categories and manage the types nested under each one.",
      count: categoryCount,
      countLabel: "categories",
    },
  ];

  return (
    <div className="min-h-screen mt-12 bg-[#F6F7F5] dark:bg-black text-[#0E1A2B] dark:text-white transition-colors">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-700 mb-8">Stocking</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map(({ to, icon: Icon, title, description, count, countLabel }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col justify-between bg-white dark:bg-black border border-[#0E1A2B]/10 dark:border-white/10 rounded-2xl p-5 hover:border-[#0E1A2B]/25 dark:hover:border-white/30 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0E1A2B]/5 text-[#0E1A2B] dark:bg-white/10 dark:text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  {count !== null && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#0E1A2B]/5 text-[#0E1A2B]/70 dark:bg-white/10 dark:text-white/70">
                      {count.toLocaleString("en-KE")} {countLabel}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-base font-700">{title}</h2>
                <p className="text-xs text-[#0E1A2B]/50 dark:text-white/50 mt-1.5 leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-[#245BE6] dark:text-red-500 mt-4">
                Go
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}