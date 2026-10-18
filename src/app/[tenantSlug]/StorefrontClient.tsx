"use client";

import React, { useState, useTransition } from "react";
import {
  createProductAction,
  deleteProductAction,
  placeOrderAction,
  updateOrderStatusAction,
  updateTenantSettingsAction,
} from "@/app/actions";
import {
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Sparkles,
  Phone,
  MessageCircle,
  Plus,
  Minus,
  Heart,
  Crown,
  Leaf,
  Trash2,
  Settings,
  Store,
  Search,
  X,
  ChevronRight,
  Package,
  Layers,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface TenantProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  isSeasonal: boolean;
  icon: string;
  image?: string | null;
  variants?: string | null;
  description: string | null;
  createdAt?: string | Date;
}

export interface ProductVariant {
  unit: string;
  price: number;
}

interface OrderItemData {
  id?: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface TenantOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryArea: string;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string | Date;
  items: OrderItemData[];
}

interface TenantData {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  whatsapp: string;
  fbPageUrl: string | null;
  deliveryLocal: number;
  deliveryDhaka: number;
  deliveryOutside: number;
  products: TenantProduct[];
  orders: TenantOrder[];
}

export interface CartItem {
  cartKey: string;
  productId: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  icon: string;
  image?: string | null;
  qty: number;
  variants: ProductVariant[];
}

export function parseVariants(p: TenantProduct): ProductVariant[] {
  if (p.variants) {
    try {
      const parsed = typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          unit: String(item.unit || p.unit),
          price: Number(item.price || p.price),
        }));
      }
    } catch {
      // fallback
    }
  }

  // Fallback defaults if variants are not specified
  if (p.category === "মধু" || p.name.includes("মধু")) {
    return [
      { unit: "৫০০ মিলি", price: 650 },
      { unit: "১ লিটার", price: 1250 },
      { unit: "২ লিটার", price: 2400 },
    ];
  } else if (p.category === "আম" || p.name.includes("আম")) {
    return [
      { unit: "৫ কেজি", price: 450 },
      { unit: "১০ কেজি", price: 850 },
      { unit: "২০ কেজি", price: 1600 },
    ];
  } else if (p.category === "গুড়" || p.name.includes("গুড়")) {
    return [
      { unit: "পাটালি (৫০০ গ্রাম)", price: 220 },
      { unit: "পাটালি (১ কেজি)", price: 420 },
      { unit: "ঝোলা গুড় (১ কেজি)", price: 450 },
      { unit: "দানা গুড় (১ কেজি)", price: 450 },
    ];
  }
  return [{ unit: p.unit, price: p.price }];
}

export function getProductBadge(p: TenantProduct) {
  if (p.category === "মধু" || p.name.includes("মধু")) {
    return {
      text: "জনপ্রিয়",
      icon: "crown",
      bgClass: "bg-[#e05915] text-white",
    };
  }
  if (p.category === "আম" || p.name.includes("আম")) {
    return {
      text: "সিজনাল",
      icon: "leaf",
      bgClass: "bg-[#178754] text-white",
    };
  }
  if (p.category === "গুড়" || p.name.includes("গুড়")) {
    return {
      text: "নতুন",
      icon: "leaf",
      bgClass: "bg-[#178754] text-white",
    };
  }
  return {
    text: p.category,
    icon: "sparkle",
    bgClass: "bg-[#178754] text-white",
  };
}

export function getProductTrustPills(p: TenantProduct) {
  if (p.category === "মধু" || p.name.includes("মধু")) {
    return [
      { icon: "👑", label: "১০০% প্রাকৃতিক" },
      { icon: "🧴", label: "কেমিক্যাল মুক্ত" },
      { icon: "🛡️", label: "খাঁটি ও বিশুদ্ধ" },
    ];
  }
  if (p.category === "আম" || p.name.includes("আম")) {
    return [
      { icon: "🌾", label: "প্রাকৃতিকভাবে পাকা" },
      { icon: "🥭", label: "মিষ্টি ও সুস্বাদু" },
      { icon: "🧴", label: "কেমিক্যাল মুক্ত" },
    ];
  }
  if (p.category === "গুড়" || p.name.includes("গুড়")) {
    return [
      { icon: "🏺", label: "প্রাকৃতিক উপাদান" },
      { icon: "🛡️", label: "কোনো ভেজাল নেই" },
      { icon: "🌾", label: "ঐতিহ্যবাহী স্বাদ" },
    ];
  }
  return [
    { icon: "🌿", label: "১০০% প্রাকৃতিক" },
    { icon: "🛡️", label: "কোনো ভেজাল নেই" },
    { icon: "🌾", label: "ঐতিহ্যবাহী স্বাদ" },
  ];
}

export function getDefaultVariant(p: TenantProduct, variants: ProductVariant[]): ProductVariant {
  if (p.category === "মধু" || p.name.includes("মধু")) {
    const v500 = variants.find((v) => v.unit.includes("৫০০"));
    if (v500) return v500;
  }
  return variants[0] || { unit: p.unit, price: p.price };
}

export default function StorefrontClient({ tenant }: { tenant: TenantData }) {
  const [viewMode, setViewMode] = useState<"STORE" | "ADMIN">("STORE");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleWishlist(id: string) {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function updateCardQty(productId: string, delta: number, maxStock: number = 99) {
    setCardQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [productId]: next };
    });
  }

  // Checkout form states
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<"LOCAL" | "DHAKA" | "OUTSIDE">("LOCAL");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const deliveryCharge =
    deliveryArea === "LOCAL"
      ? tenant.deliveryLocal
      : deliveryArea === "DHAKA"
      ? tenant.deliveryDhaka
      : tenant.deliveryOutside;

  const subTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const grandTotal = cart.length > 0 ? subTotal + deliveryCharge : 0;
  const totalCartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Dynamic Categories
  const existingCategories = Array.from(new Set(tenant.products.map((p) => p.category)));
  const categoriesList = ["ALL", ...Array.from(new Set(["মধু", "আম", "গুড়", ...existingCategories]))];

  const filteredProducts = tenant.products.filter((p) => {
    const matchCat = selectedCat === "ALL" || p.category === selectedCat;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Ensure Honey products appear first
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.category === "মধু" && b.category !== "মধু") return -1;
    if (b.category === "মধু" && a.category !== "মধু") return 1;
    return 0;
  });

  function addToCart(product: TenantProduct, variant?: ProductVariant, qtyToAdd: number = 1) {
    if (product.stock <= 0) {
      alert("দুঃখিত, এই পণ্যটি বর্তমানে স্টক আউট!");
      return;
    }
    const allVariants = parseVariants(product);
    const activeVar = variant || selectedVariants[product.id] || getDefaultVariant(product, allVariants);
    const cartKey = `${product.id}_${activeVar.unit}`;

    setCart((prev) => {
      const exists = prev.find((item) => item.cartKey === cartKey);
      if (exists) {
        const nextQty = exists.qty + qtyToAdd;
        if (nextQty > product.stock) {
          alert(`সর্বোচ্চ স্টক সীমা (${product.stock}) পৌঁছে গেছে!`);
          return prev;
        }
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, qty: nextQty } : item
        );
      }
      return [
        ...prev,
        {
          cartKey,
          productId: product.id,
          name: product.name,
          category: product.category,
          unit: activeVar.unit,
          price: activeVar.price,
          stock: product.stock,
          icon: product.icon,
          image: product.image,
          qty: qtyToAdd,
          variants: allVariants,
        },
      ];
    });
    setIsCartOpen(true);
  }

  function updateQty(cartKey: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.qty + delta;
            if (nextQty > item.stock) {
              alert(`স্টকে কেবল ${item.stock} টি পণ্য অবশিষ্ট আছে!`);
              return item;
            }
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  }

  function removeFromCart(cartKey: string) {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  }

  function changeCartItemVariant(currentCartKey: string, newUnit: string) {
    setCart((prev) => {
      const itemIndex = prev.findIndex((i) => i.cartKey === currentCartKey);
      if (itemIndex === -1) return prev;
      const currentItem = prev[itemIndex];
      const newVariant = currentItem.variants.find((v) => v.unit === newUnit);
      if (!newVariant) return prev;

      const newCartKey = `${currentItem.productId}_${newUnit}`;
      if (newCartKey === currentCartKey) return prev;

      const existingTargetIndex = prev.findIndex((i) => i.cartKey === newCartKey);
      if (existingTargetIndex !== -1) {
        // Merge into target if it already exists
        return prev
          .filter((_, idx) => idx !== itemIndex)
          .map((item) =>
            item.cartKey === newCartKey
              ? { ...item, qty: Math.min(item.qty + currentItem.qty, item.stock) }
              : item
          );
      }

      // Update unit and price in-place
      return prev.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              cartKey: newCartKey,
              unit: newVariant.unit,
              price: newVariant.price,
            }
          : item
      );
    });
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return alert("কার্টে পণ্য যোগ করুন!");
    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      return alert("অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা প্রদান করুন।");
    }

    setLoading(true);
    try {
      const res = await placeOrderAction({
        tenantId: tenant.id,
        slug: tenant.slug,
        customerName: custName,
        customerPhone: custPhone,
        shippingAddress: custAddress,
        deliveryArea,
        deliveryCharge,
        paymentMethod,
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.name,
          unit: c.unit,
          quantity: c.qty,
          unitPrice: c.price,
        })),
      });

      setCart([]);
      setIsCartOpen(false);
      setOrderSuccessMsg(
        `আলহামদুলিল্লাহ! আপনার অর্ডার (${res.orderNumber}) সফলভাবে গৃহীত হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি যোগাযোগ করবেন।`
      );
      setCustName("");
      setCustPhone("");
      setCustAddress("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে";
      alert("ত্রুটি: " + message);
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppOrder() {
    if (cart.length === 0) return alert("প্রথমে কার্টে পণ্য যোগ করুন!");
    const lines = cart
      .map((i) => `• ${i.name} (${i.unit}) x ${i.qty} = ৳${i.price * i.qty}`)
      .join("%0A");
    const msg = `আসসালামু আলাইকুম *${tenant.name}*,%0Aআমি নিচের পণ্যগুলো অর্ডার করতে চাই:%0A${lines}%0A*ডেলিভারি চার্জ:* ৳${deliveryCharge}%0A*সর্বমোট বিল:* ৳${grandTotal}%0A%0A*নাম:* ${encodeURIComponent(custName || "উল্লেখ করা হয়নি")}%0A*মোবাইল:* ${encodeURIComponent(custPhone || "উল্লেখ করা হয়নি")}%0A*ঠিকানা:* ${encodeURIComponent(custAddress || "উল্লেখ করা হয়নি")}`;
    window.open(`https://wa.me/${tenant.whatsapp}?text=${msg}`, "_blank");
  }

  // Quick stats for Admin
  const totalRevenue = tenant.orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0);
  const pendingOrdersCount = tenant.orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Banner & Multi-Tenant Switcher */}
      <div className="bg-emerald-950 text-emerald-200 text-xs px-4 py-2.5 border-b border-emerald-900 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-400 text-emerald-950 font-bold px-2.5 py-0.5 rounded-full text-[11px] shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-950" />
              Turso + Prisma Multi-Tenant
            </span>
            <span className="text-emerald-300 font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-800">
              Active Store Slug: /{tenant.slug}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-900/80 p-1 rounded-xl border border-emerald-800/80">
            <button
              onClick={() => setViewMode("STORE")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "STORE"
                  ? "bg-amber-400 text-emerald-950 shadow-sm"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              কাস্টমার ভিউ
            </button>
            <button
              onClick={() => setViewMode("ADMIN")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "ADMIN"
                  ? "bg-amber-400 text-emerald-950 shadow-sm"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              অ্যাডমিন প্যানেল
              {tenant.orders.length > 0 && (
                <span className="bg-emerald-700 text-amber-200 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {tenant.orders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white text-xl shadow-md border border-emerald-700/50">
              🌿
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
                {tenant.name}
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  ভেরিফাইড
                </span>
              </h1>
              <p className="text-xs text-stone-500 font-medium line-clamp-1">
                {tenant.tagline || "১০০% প্রাকৃতিক ও খাঁটি উপাদানের বিশ্বস্ত প্রতিষ্ঠান"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href={`https://wa.me/${tenant.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:scale-[1.02]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>WhatsApp মেসেজ</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 font-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all border border-amber-600/30"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-950" />
              <span>কার্ট</span>
              {totalCartCount > 0 && (
                <span className="bg-emerald-950 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold ml-1 shadow animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Order Success Toast */}
      {orderSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold">{orderSuccessMsg}</p>
            </div>
            <button
              onClick={() => setOrderSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg hover:bg-emerald-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STOREFRONT VIEW ==================== */}
      {viewMode === "STORE" ? (
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
          {/* Hero Banner with Option 1: Floating Showcase + Rating + Action CTAs */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-[#063828] to-stone-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 mb-8 shadow-2xl border border-emerald-800/40">
            {/* Ambient Lighting Gradients */}
            <div className="absolute top-0 right-1/4 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading, Value Proposition & Action Buttons */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 text-xs font-black px-4 py-1.5 rounded-full mb-4 shadow-md w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-950" />
                  <span>১০০% প্রাকৃতিক ও দেশীয় উপাদানের নিশ্চয়তা</span>
                </div>

                <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black leading-[1.25] tracking-tight text-white">
                  খাঁটি <span className="text-amber-300 underline decoration-amber-400/50 decoration-wavy">মধু</span>, রাজশাহীর <span className="text-amber-300">মিষ্টি আম</span> ও ভেজালমুক্ত <span className="text-amber-300">গুড়ের</span> বিশ্বস্ত প্রতিষ্ঠান
                </h2>

                <p className="text-emerald-100/90 text-sm sm:text-base mt-4 leading-relaxed max-w-xl font-normal">
                  সরাসরি মৌয়াল ও রাজশাহীর নিজস্ব বাগান থেকে সংগৃহীত ১০০% নির্ভেজাল খাদ্যোপাদান। কোনো প্রকার কেমিক্যাল বা প্রিজারভেটিভ ছাড়া খাঁটি স্বাদের সর্বোচ্চ নিশ্চয়তা।
                </p>

                {/* 2 Primary Action CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 mt-6">
                  <button
                    onClick={() => {
                      document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-2.5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-emerald-950 font-black px-6 py-3.5 rounded-2xl text-sm sm:text-base shadow-xl shadow-amber-950/30 transition-all hover:scale-[1.02]"
                  >
                    <ShoppingBag className="w-5 h-5 text-emerald-950" />
                    <span>পণ্যসমূহ দেখুন ও অর্ডার করুন</span>
                  </button>

                  <a
                    href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                      `আসসালামু আলাইকুম ${tenant.name}, আমি আপনাদের পণ্য অর্ডার সংক্রান্ত বিষয়ে জানতে চাচ্ছি।`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-900/80 hover:bg-emerald-800/90 active:scale-95 text-emerald-100 border border-emerald-600/50 backdrop-blur-md font-bold px-5 py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-md hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <span>WhatsApp-এ কথা বলুন</span>
                  </a>
                </div>

                {/* Guarantees Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-emerald-800/60 text-xs text-emerald-200 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>শতভাগ কেমিক্যালমুক্ত</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>ক্যাশ অন ডেলিভারি</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>দ্রুততম হোম ডেলিভারি</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Product Showcase with Layered Floating Cards */}
              <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
                {/* Main Hero Featured Product Card */}
                <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-emerald-900/50 backdrop-blur-md group">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src="/products/honey.jpg"
                      alt="Pure Raw Honey"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 right-3 bg-amber-400 text-emerald-950 text-[11px] font-black px-2.5 py-1 rounded-full shadow">
                      বেস্টসেলার
                    </div>
                  </div>
                </div>

                {/* Floating Mango Card (Top-Left) */}
                <div className="absolute -top-3 -left-3 sm:-left-6 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-stone-200/90 flex items-center gap-2.5 z-20 hover:scale-105 transition-transform">
                  <img
                    src="/products/mango.jpg"
                    alt="Mango"
                    className="w-11 h-11 rounded-xl object-cover border border-amber-200"
                  />
                  <div className="pr-2">
                    <span className="text-[10px] text-stone-500 font-bold block">সিজনাল বাছাই</span>
                    <span className="text-xs font-black text-emerald-950 block">মিষ্টি পাকা আম 🥭</span>
                  </div>
                </div>

                {/* Floating Gur Card (Bottom-Left) */}
                <div className="absolute -bottom-3 -left-3 sm:-left-4 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-stone-200/90 flex items-center gap-2.5 z-20 hover:scale-105 transition-transform">
                  <img
                    src="/products/gur.jpg"
                    alt="Gur"
                    className="w-11 h-11 rounded-xl object-cover border border-amber-200"
                  />
                  <div className="pr-2">
                    <span className="text-[10px] text-stone-500 font-bold block">ঐতিহ্যবাহী</span>
                    <span className="text-xs font-black text-amber-900 block">খাঁটি খেজুরের গুড় 🏺</span>
                  </div>
                </div>

                {/* Floating Customer Social Proof Badge (Bottom-Right) */}
                <div className="absolute -bottom-4 -right-2 sm:-right-4 bg-emerald-950/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-emerald-700/70 z-20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-base shadow">
                    ★
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs">
                      <span>৪.৯ / ৫.০</span>
                      <span className="text-stone-300 font-normal text-[11px]">(১,৫০০+ রিভিউ)</span>
                    </div>
                    <p className="text-[10px] text-emerald-200 font-medium">ভেরিফাইড সন্তুষ্ট ক্রেতা</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div id="products-section" className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCat === cat
                      ? "bg-emerald-800 text-white shadow-md scale-[1.02]"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  {cat === "ALL" ? "সব পণ্য (" + tenant.products.length + ")" : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="পণ্য বা বিবরণ খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center my-6">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-stone-700">কোনো পণ্য পাওয়া যায়নি!</h3>
              <p className="text-sm text-stone-500 mt-1">অন্য ক্যাটাগরি বা নামে অনুসন্ধান করে দেখুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((p) => {
                const productVariants = parseVariants(p);
                const activeVariant = selectedVariants[p.id] || getDefaultVariant(p, productVariants);
                const cardQty = cardQuantities[p.id] || 1;
                const isWishlisted = !!wishlist[p.id];

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    <div>
                      {/* Product Image Container (Clean & Uncluttered) */}
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-4">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 text-6xl">
                            {p.icon || "🍯"}
                          </div>
                        )}

                        {/* Top-Left Category / Status Badge */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                          {p.isSeasonal ? (
                            <span className="bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              সিজনাল
                            </span>
                          ) : (
                            <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-100 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                              {p.category}
                            </span>
                          )}
                        </div>

                        {/* Top-Right Heart Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p.id)}
                          aria-label="Wishlist"
                          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-stone-600 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isWishlisted ? "fill-rose-500 text-rose-500" : "text-stone-600"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Product Title & Subtitle */}
                      <h3 className="font-extrabold text-lg text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                        {p.description || "১০০% নির্ভেজাল ও স্বাস্থ্যসম্মত খাঁটি দেশীয় পণ্য।"}
                      </p>

                      {/* Clean Size Selector Pills */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                            {p.category === "গুড়" || p.name.includes("গুড়") ? "ধরণ ও সাইজ নির্বাচন" : "সাইজ নির্বাচন"}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {activeVariant.unit}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {productVariants.map((v) => {
                            const isSelected = activeVariant.unit === v.unit;
                            return (
                              <button
                                key={v.unit}
                                type="button"
                                onClick={() => setSelectedVariants((prev) => ({ ...prev, [p.id]: v }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? "bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-700/30 scale-[1.02]"
                                    : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                                }`}
                              >
                                <span>{v.unit}</span>
                                <span
                                  className={`text-[10px] ${
                                    isSelected ? "text-emerald-200 font-extrabold" : "text-stone-500"
                                  }`}
                                >
                                  ৳{v.price}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Area: Pricing, Quantity Stepper & Buttons */}
                    <div className="mt-5 pt-3.5 border-t border-stone-100 space-y-3.5">
                      {/* Price & Quantity Row */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-emerald-950 tracking-tight">
                              ৳{activeVariant.price * cardQty}
                            </span>
                            <span className="text-xs text-stone-400 font-medium">
                              / {activeVariant.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>স্টকে আছে</span>
                          </div>
                        </div>

                        {/* Minimalist Quantity Stepper */}
                        <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200/70">
                          <button
                            type="button"
                            onClick={() => updateCardQty(p.id, -1, p.stock)}
                            className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition active:scale-90 text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-black text-stone-900 font-mono">
                            {cardQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCardQty(p.id, 1, p.stock)}
                            className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition active:scale-90 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                            `আসসালামু আলাইকুম, আমি "${p.name} (${activeVariant.unit}) x ${cardQty} = ৳${activeVariant.price * cardQty}" অর্ডার করতে আগ্রহী।`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp-এ অর্ডার"
                          className="px-3.5 py-2.5 rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-700 transition flex items-center justify-center shadow-sm active:scale-95"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </a>
                        <button
                          onClick={() => addToCart(p, activeVariant, cardQty)}
                          disabled={p.stock <= 0}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98 disabled:bg-stone-300 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>কার্টে যোগ করুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      ) : (
        /* ==================== ADMIN DASHBOARD VIEW ==================== */
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">মোট অর্ডার</span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">{tenant.orders.length} টি</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">পেন্ডিং অর্ডার</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingOrdersCount} টি</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">মোট পণ্য তালিকা</span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">{tenant.products.length} টি</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">মোট অর্ডার বিক্রয়</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">৳{totalRevenue}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Add Product & Tenant Settings */}
            <div className="space-y-6">
              {/* Add Product Form */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Package className="w-5 h-5 text-emerald-800" />
                  <h3 className="font-extrabold text-lg text-emerald-950">নতুন পণ্য যোগ করুন</h3>
                </div>

                <form
                  action={async (formData) => {
                    startTransition(async () => {
                      await createProductAction(tenant.id, tenant.slug, formData);
                      alert("পণ্য সফলভাবে যুক্ত হয়েছে!");
                    });
                  }}
                  className="space-y-3.5 text-sm"
                >
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">পণ্যের নাম *</label>
                    <input
                      name="name"
                      required
                      placeholder="যেমন: লিচু ফুলের খাঁটি মধু"
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ক্যাটাগরি</label>
                      <select
                        name="category"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      >
                        <option value="মধু">মধু</option>
                        <option value="আম">আম</option>
                        <option value="গুড়">গুড়</option>
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ওজন/প্যাক *</label>
                      <input
                        name="unit"
                        required
                        placeholder="১ কেজি / ৫০০ গ্রাম"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">মূল্য (৳) *</label>
                      <input
                        name="price"
                        type="number"
                        required
                        placeholder="৬৫০"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">স্টক *</label>
                      <input
                        name="stock"
                        type="number"
                        required
                        defaultValue="20"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ছবির লিংক / পাথ</label>
                      <input
                        name="image"
                        placeholder="যেমন: /products/honey.jpg"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ইমোজি</label>
                      <input
                        name="icon"
                        defaultValue="🍯"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-center text-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">পণ্যের বিবরণ</label>
                    <textarea
                      rows={2}
                      name="description"
                      placeholder="পণ্য সম্পর্কে সংক্ষেপে কিছু লিখুন..."
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">
                      সাইজ ভ্যারিয়েন্টস (JSON - ঐচ্ছিক)
                    </label>
                    <input
                      name="variants"
                      placeholder='[{"unit": "২৫০ গ্রাম", "price": 350}, {"unit": "৫০০ গ্রাম", "price": 650}]'
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-400">
                      খালি রাখলে ক্যাটাগরি অনুযায়ী অটোমেটিক সাইজ রেঞ্জ তৈরি হবে।
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer pt-1">
                    <input type="checkbox" name="isSeasonal" className="w-4 h-4 rounded text-emerald-800" />
                    সিজনাল পণ্য (আম / শীতের গুড়)
                  </label>

                  <button
                    disabled={isPending}
                    type="submit"
                    className="w-full bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold py-2.5 rounded-xl transition shadow"
                  >
                    {isPending ? "সেভ হচ্ছে..." : "+ ডাটাবেসে সেভ করুন"}
                  </button>
                </form>
              </div>

              {/* Tenant Settings */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Settings className="w-5 h-5 text-emerald-800" />
                  <h3 className="font-extrabold text-lg text-emerald-950">স্টোর ও ডেলিভারি সেটিংস</h3>
                </div>

                <form
                  action={async (formData) => {
                    startTransition(async () => {
                      await updateTenantSettingsAction(tenant.id, tenant.slug, formData);
                      alert("সেটিংস সফলভাবে আপডেট হয়েছে!");
                    });
                  }}
                  className="space-y-3 text-sm"
                >
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">স্টোরের নাম</label>
                    <input
                      name="name"
                      defaultValue={tenant.name}
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">WhatsApp নাম্বার (880...)</label>
                    <input
                      name="whatsapp"
                      defaultValue={tenant.whatsapp}
                      placeholder="8801700000000"
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">ডেলিভারি চার্জ (৳)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-stone-500 block mb-0.5">রাজশাহী</span>
                        <input
                          name="deliveryLocal"
                          type="number"
                          defaultValue={tenant.deliveryLocal}
                          className="w-full border border-stone-200 rounded-xl px-2 py-1.5 text-center text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block mb-0.5">ঢাকা সিটি</span>
                        <input
                          name="deliveryDhaka"
                          type="number"
                          defaultValue={tenant.deliveryDhaka}
                          className="w-full border border-stone-200 rounded-xl px-2 py-1.5 text-center text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block mb-0.5">সারা বাংলাদেশ</span>
                        <input
                          name="deliveryOutside"
                          type="number"
                          defaultValue={tenant.deliveryOutside}
                          className="w-full border border-stone-200 rounded-xl px-2 py-1.5 text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isPending}
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 font-bold py-2 rounded-xl transition shadow-sm"
                  >
                    {isPending ? "আপডেট হচ্ছে..." : "সেটিংস আপডেট করুন"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Customer Orders & Inventory */}
            <div className="lg:col-span-2 space-y-6">
              {/* Orders List */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-800" />
                    <h3 className="font-extrabold text-lg text-emerald-950">কাস্টমার অর্ডার সমূহ</h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 text-xs px-2.5 py-1 rounded-full font-bold">
                    মোট: {tenant.orders.length}
                  </span>
                </div>

                {tenant.orders.length === 0 ? (
                  <div className="text-center py-8 text-stone-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">এখনো কোনো অর্ডার আসেনি।</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {tenant.orders.map((o) => {
                      const statusColor =
                        o.status === "CONFIRMED"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : o.status === "SHIPPED"
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : o.status === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : o.status === "CANCELLED"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200";

                      return (
                        <div
                          key={o.id}
                          className="border border-stone-200 rounded-2xl p-4 bg-stone-50/60 hover:bg-white transition shadow-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-stone-200/60 pb-2">
                            <div>
                              <span className="font-extrabold text-sm text-emerald-950 font-mono">
                                #{o.orderNumber}
                              </span>
                              <span className="text-stone-400 mx-2">•</span>
                              <span className="font-bold text-sm text-stone-900">{o.customerName}</span>
                              <span className="text-stone-500 text-xs ml-1">({o.customerPhone})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                defaultValue={o.status}
                                onChange={(e) =>
                                  startTransition(() =>
                                    updateOrderStatusAction(o.id, e.target.value, tenant.slug)
                                  )
                                }
                                className={`text-xs font-bold border rounded-xl px-2.5 py-1 focus:outline-none ${statusColor}`}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                            <div>
                              <span className="font-semibold text-stone-700">ঠিকানা:</span> {o.shippingAddress} (
                              {o.deliveryArea === "LOCAL" ? "রাজশাহী" : o.deliveryArea === "DHAKA" ? "ঢাকা" : "অন্যান্য"}
                              )
                            </div>
                            <div>
                              <span className="font-semibold text-stone-700">পেমেন্ট মেথড:</span> {o.paymentMethod}
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 text-xs text-stone-800 space-y-1">
                            <span className="font-semibold text-stone-500 block mb-1">অর্ডারকৃত পণ্য:</span>
                            {o.items.map((i, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span>
                                  • {i.productName} ({i.unit}) × {i.quantity}
                                </span>
                                <span className="font-medium">৳{i.unitPrice * i.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <div className="text-sm font-extrabold text-emerald-950">
                              সর্বমোট বিল: <span className="text-amber-700 font-mono">৳{o.totalAmount}</span>
                              <span className="text-xs text-stone-500 font-normal ml-1">
                                (ডেলিভারি ৳{o.deliveryCharge})
                              </span>
                            </div>

                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={`https://wa.me/88${o.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `আসসালামু আলাইকুম ${o.customerName}, "${tenant.name}" থেকে আপনার অর্ডার (${o.orderNumber}) এখন "${o.status}" পর্যায়ে রয়েছে।`
                              )}`}
                              className="inline-flex items-center gap-1.5 text-green-700 hover:text-green-800 text-xs font-bold hover:underline"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                              কাস্টমারকে WhatsApp বার্তা
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Product Inventory Table */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-800" />
                    <h3 className="font-extrabold text-lg text-emerald-950">প্রোডাক্ট ও স্টক তালিকা</h3>
                  </div>
                  <span className="text-xs text-stone-500">মোট পণ্য: {tenant.products.length}</span>
                </div>

                <div className="divide-y divide-stone-100 text-sm">
                  {tenant.products.map((p) => (
                    <div key={p.id} className="py-3 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{p.icon || "📦"}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block">{p.name}</span>
                          <span className="text-xs text-stone-500">
                            {p.unit} • মূল্য: ৳{p.price} •{" "}
                            <span className={p.stock <= 5 ? "text-amber-600 font-bold" : "text-emerald-700"}>
                              স্টক: {p.stock}
                            </span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`আপনি কি "${p.name}" মুছে ফেলতে নিশ্চিত?`)) {
                            startTransition(() => deleteProductAction(p.id, tenant.slug));
                          }
                        }}
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 transition text-xs font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">ডিলিট</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ==================== CART DRAWER ==================== */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl border-l border-stone-200">
            <div>
              {/* Cart Drawer Header */}
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-800" />
                  <h3 className="font-extrabold text-xl text-stone-900">আপনার শপিং কার্ট</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-stone-600">কার্ট খালি রয়েছে</p>
                  <p className="text-xs text-stone-400 mt-1">দয়া করে স্টোর থেকে পণ্য যোগ করুন।</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 my-4 max-h-[48vh] overflow-y-auto pr-1 space-y-1">
                  {cart.map((c) => (
                    <div key={c.cartKey} className="py-3.5 space-y-2.5">
                      <div className="flex justify-between items-start gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 flex items-center justify-center">
                            {c.image ? (
                              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{c.icon || "🍯"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 text-sm leading-snug">{c.name}</div>
                            <div className="text-xs text-stone-500 font-medium mt-0.5">
                              একক মূল্য: <span className="font-bold text-emerald-900">৳{c.price}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(c.cartKey)}
                          className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="কার্ট থেকে মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interactive Size Selector & Quantity Counter */}
                      <div className="flex items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                        {/* Size Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-stone-600 whitespace-nowrap">সাইজ:</label>
                          <select
                            value={c.unit}
                            onChange={(e) => changeCartItemVariant(c.cartKey, e.target.value)}
                            className="bg-white border border-stone-300 text-emerald-950 text-xs font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-700 focus:outline-none shadow-sm cursor-pointer"
                          >
                            {c.variants.map((v) => (
                              <option key={v.unit} value={v.unit}>
                                {v.unit} — ৳{v.price}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 bg-white px-1.5 py-0.5 rounded-lg border border-stone-200 shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateQty(c.cartKey, -1)}
                            className="w-6 h-6 bg-stone-100 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-stone-700 transition active:scale-95 text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-black text-stone-900">{c.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(c.cartKey, 1)}
                            className="w-6 h-6 bg-stone-100 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-stone-700 transition active:scale-95 text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-950 font-mono">
                            ৳{c.price * c.qty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="space-y-3.5 border-t border-stone-200 pt-4 text-sm">
                <div>
                  <input
                    required
                    placeholder="আপনার পুরো নাম *"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    required
                    placeholder="মোবাইল নাম্বার (01XXXXXXXXX) *"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <textarea
                    required
                    rows={2}
                    placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা) *"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 mb-1 block">ডেলিভারি এরিয়া</label>
                    <select
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value as "LOCAL" | "DHAKA" | "OUTSIDE")}
                      className="w-full border border-stone-200 rounded-xl px-2.5 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    >
                      <option value="LOCAL">রাজশাহী সিটি (৳{tenant.deliveryLocal})</option>
                      <option value="DHAKA">ঢাকা সিটি (৳{tenant.deliveryDhaka})</option>
                      <option value="OUTSIDE">সারা বাংলাদেশ (৳{tenant.deliveryOutside})</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-500 mb-1 block">পেমেন্ট মেথড</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-2.5 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    >
                      <option value="COD">ক্যাশ অন ডেলিভারি</option>
                      <option value="bKash">বিকাশ (bKash)</option>
                      <option value="Nagad">নগদ (Nagad)</option>
                    </select>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>পণ্যের মোট মূল্য:</span>
                    <span>৳{subTotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>৳{deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-emerald-950 border-t border-amber-200/60 pt-1.5">
                    <span>সর্বমোট প্রদেয় বিল:</span>
                    <span className="text-amber-800 font-mono text-base">৳{grandTotal}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-extrabold py-3 rounded-xl transition shadow-md disabled:bg-emerald-700/60"
                  >
                    {loading ? "অর্ডার সাবমিট হচ্ছে..." : "অর্ডার কনফার্ম করুন (৳" + grandTotal + ")"}
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    WhatsApp-এ সরাসরি অর্ডার পাঠান
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 mt-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-stone-200 text-sm">{tenant.name}</p>
            <p className="mt-1">১০০% প্রাকৃতিক ও খাঁটি উপাদানের বিশ্বস্ত ঠিকানা।</p>
          </div>
          <div className="text-stone-500">
            Powered by Next.js 16 + TypeScript + Prisma ORM + Turso (libSQL) Multi-Tenant Engine.
          </div>
        </div>
      </footer>
    </div>
  );
}
