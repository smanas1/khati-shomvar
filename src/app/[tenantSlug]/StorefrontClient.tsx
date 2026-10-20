"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { placeOrderAction } from "@/app/actions";
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
  Heart,
  Crown,
  Leaf,
  Trash2,
  Search,
  X,
  Package,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowUp,
  FileText,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Award,
  Check,
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

interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
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

export function getDefaultVariant(p: TenantProduct, variants: ProductVariant[]): ProductVariant {
  if (p.category === "মধু" || p.name.includes("মধু")) {
    const v500 = variants.find((v) => v.unit.includes("৫০০"));
    if (v500) return v500;
  }
  return variants[0] || { unit: p.unit, price: p.price };
}

function formatPhoneDisplay(phoneStr: string): string {
  const clean = phoneStr.replace(/\D/g, "");
  if (clean.startsWith("880") && clean.length === 13) {
    return `+880 ${clean.slice(3, 7)}-${clean.slice(7)}`;
  }
  if (clean.startsWith("01") && clean.length === 11) {
    return `+88 ${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return phoneStr;
}

export default function StorefrontClient({ tenant }: { tenant: TenantData }) {
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Checkout form states
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custNote, setCustNote] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<"LOCAL" | "DHAKA" | "OUTSIDE">("LOCAL");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Toast Helper
  const addToast = (type: "success" | "error" | "warning" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // LocalStorage Cart & Wishlist Hydration (SSR safe)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(`khati_cart_${tenant.slug}`);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
      const savedWishlist = localStorage.getItem(`khati_wishlist_${tenant.slug}`);
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (typeof parsed === "object" && parsed !== null) setWishlist(parsed);
      }
    } catch {
      // fallback
    }
    setIsHydrated(true);
  }, [tenant.slug]);

  // Sync to LocalStorage on updates
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(`khati_cart_${tenant.slug}`, JSON.stringify(cart));
    } catch {
      // storage full / disabled
    }
  }, [cart, isHydrated, tenant.slug]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(`khati_wishlist_${tenant.slug}`, JSON.stringify(wishlist));
    } catch {
      // storage full / disabled
    }
  }, [wishlist, isHydrated, tenant.slug]);

  // Scroll to Top Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleWishlist(id: string) {
    setWishlist((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        addToast("info", "পণ্যটি আপনার পছন্দের তালিকায় যোগ করা হয়েছে।");
      }
      return { ...prev, [id]: nextState };
    });
  }

  function toggleDescription(id: string) {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function updateCardQty(productId: string, delta: number, maxStock: number = 99) {
    setCardQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [productId]: next };
    });
  }

  const deliveryCharge =
    deliveryArea === "LOCAL"
      ? tenant.deliveryLocal
      : deliveryArea === "DHAKA"
      ? tenant.deliveryDhaka
      : tenant.deliveryOutside;

  const subTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const grandTotal = cart.length > 0 ? subTotal + deliveryCharge : 0;
  const totalCartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Dynamic Categories & counts
  const rawCategories = Array.from(new Set(tenant.products.map((p) => p.category)));
  const categoriesList = ["ALL", ...Array.from(new Set(["মধু", "আম", "গুড়", ...rawCategories]))];

  const getCategoryCount = (cat: string) => {
    if (cat === "ALL") return tenant.products.length;
    return tenant.products.filter((p) => p.category === cat).length;
  };

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

  const heroProduct = tenant.products[0];
  const heroImage = heroProduct?.image || "/products/honey.jpg";

  function addToCart(
    product: TenantProduct,
    variant?: ProductVariant,
    qtyToAdd: number = 1,
    openDrawer: boolean = false
  ) {
    if (product.stock <= 0) {
      addToast("error", `দুঃখিত, "${product.name}" বর্তমানে স্টক আউট!`);
      return;
    }
    const allVariants = parseVariants(product);
    const activeVar = variant || selectedVariants[product.id] || getDefaultVariant(product, allVariants);
    const cartKey = `${product.id}_${activeVar.unit}`;

    let reachedMax = false;

    setCart((prev) => {
      const exists = prev.find((item) => item.cartKey === cartKey);
      if (exists) {
        const nextQty = exists.qty + qtyToAdd;
        if (nextQty > product.stock) {
          reachedMax = true;
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

    if (reachedMax) {
      addToast("warning", `সর্বোচ্চ স্টক সীমা (${product.stock} টি) কার্টে রয়েছে!`);
      return;
    }

    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      setAddedItemKey(cartKey);
      addToast("success", `"${product.name} (${activeVar.unit})" কার্টে যোগ করা হয়েছে!`);
      setTimeout(() => {
        setAddedItemKey(null);
      }, 1500);
    }
  }

  function updateQty(cartKey: string, delta: number) {
    let warningMsg: string | null = null;
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.qty + delta;
            if (nextQty > item.stock) {
              warningMsg = `স্টকে কেবল ${item.stock} টি অবশিষ্ট আছে!`;
              return item;
            }
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
    if (warningMsg) {
      addToast("warning", warningMsg);
    }
  }

  function removeFromCart(cartKey: string) {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
    addToast("info", "পণ্যটি কার্ট থেকে সরানো হয়েছে।");
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
        return prev
          .filter((_, idx) => idx !== itemIndex)
          .map((item) =>
            item.cartKey === newCartKey
              ? { ...item, qty: Math.min(item.qty + currentItem.qty, item.stock) }
              : item
          );
      }

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
    if (cart.length === 0) {
      addToast("warning", "কার্ট খালি! অনুগ্রহ করে প্রথমে পণ্য যোগ করুন।");
      return;
    }
    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      addToast("error", "অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা প্রদান করুন।");
      return;
    }

    // Phone validation (Bangladesh 11 digit format)
    const cleanPhone = custPhone.replace(/\D/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      addToast("error", "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
      return;
    }

    setLoading(true);
    try {
      const fullShippingAddress = custNote.trim()
        ? `${custAddress.trim()}\n[নির্দেশনা: ${custNote.trim()}]`
        : custAddress.trim();

      const res = await placeOrderAction({
        tenantId: tenant.id,
        slug: tenant.slug,
        customerName: custName.trim(),
        customerPhone: cleanPhone,
        shippingAddress: fullShippingAddress,
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
        `আলহামদুলিল্লাহ! আপনার অর্ডার (${res.orderNumber}) সফলভাবে গৃহীত হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি আপনার নম্বরে যোগাযোগ করবেন।`
      );
      addToast("success", `অর্ডার সফল! অর্ডার নম্বর: ${res.orderNumber}`);
      setCustName("");
      setCustPhone("");
      setCustAddress("");
      setCustNote("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে";
      addToast("error", "ত্রুটি: " + message);
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppOrder() {
    if (cart.length === 0) {
      addToast("warning", "প্রথমে কার্টে পণ্য যোগ করুন!");
      return;
    }

    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      addToast("info", "সহজ ডেলিভারির জন্য নাম, ফোন ও ঠিকানা পূরণ করার পরামর্শ দেওয়া হলো।");
    }

    const lines = cart
      .map((i) => `• ${i.name} (${i.unit}) x ${i.qty} = ৳${i.price * i.qty}`)
      .join("%0A");

    const notePart = custNote.trim() ? `%0A*বিশেষ নির্দেশনা:* ${encodeURIComponent(custNote.trim())}` : "";
    const msg = `আসসালামু আলাইকুম *${tenant.name}*,%0Aআমি নিচের পণ্যগুলো অর্ডার করতে চাই:%0A${lines}%0A*ডেলিভারি চার্জ:* ৳${deliveryCharge}%0A*সর্বমোট বিল:* ৳${grandTotal}%0A%0A*নাম:* ${encodeURIComponent(custName.trim() || "উল্লেখ করা হয়নি")}%0A*মোবাইল:* ${encodeURIComponent(custPhone.trim() || "উল্লেখ করা হয়নি")}%0A*ঠিকানা:* ${encodeURIComponent(custAddress.trim() || "উল্লেখ করা হয়নি")}${notePart}`;

    window.open(`https://wa.me/${tenant.whatsapp}?text=${msg}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white relative">
      {/* ==================== TOAST NOTIFICATION CONTAINER ==================== */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-fadeIn ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/50 text-white"
                : toast.type === "error"
                ? "bg-rose-950/95 border-rose-500/50 text-white"
                : toast.type === "warning"
                ? "bg-amber-950/95 border-amber-500/50 text-white"
                : "bg-stone-900/95 border-stone-700 text-white"
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white transition p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Customer Announcement Bar */}
      <div className="bg-emerald-950 text-emerald-200 text-xs px-4 py-2.5 border-b border-emerald-900 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full text-[11px] shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-950" />
              ১০০% খাঁটি ও নির্ভেজাল
            </span>
            <span className="text-emerald-100 font-medium">
              সরাসরি মৌয়াল ও রাজশাহীর নিজস্ব বাগান থেকে সংগৃহীত প্রাকৃতিক খাদ্যোপাদান
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-emerald-200">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>সারাদেশে হোম ডেলিভারি</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>হটলাইন: {formatPhoneDisplay(tenant.whatsapp)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 border border-emerald-500/30 group">
              <Leaf className="w-5.5 h-5.5 text-emerald-200 group-hover:rotate-6 transition-transform duration-300 drop-shadow" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-emerald-950" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
                {tenant.name}
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  খাঁটি সম্ভার
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

      {/* Order Success Banner */}
      {orderSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full animate-fadeIn">
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

      {/* ==================== STOREFRONT MAIN ==================== */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Hero Banner with Dynamic Images & Social Proof */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-[#063828] to-stone-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 mb-8 shadow-2xl border border-emerald-800/40">
          <div className="absolute top-0 right-1/4 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading, Value Proposition & Action CTAs */}
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

              {/* Action CTAs */}
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

            {/* Right Column: Visual Product Showcase */}
            <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
              <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-emerald-900/50 backdrop-blur-md group">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                  <Image
                    src={heroImage}
                    alt={heroProduct?.name || "Featured Product"}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 right-3 bg-amber-400 text-emerald-950 text-[11px] font-black px-2.5 py-1 rounded-full shadow">
                    বেস্টসেলার
                  </div>
                </div>
              </div>

              {/* Floating Mango Card */}
              <div className="absolute -top-3 -left-2 sm:-left-6 bg-white/95 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl shadow-xl border border-stone-200/90 flex items-center gap-2 sm:gap-2.5 z-20 hover:scale-105 transition-transform">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden relative border border-amber-200 flex-shrink-0 bg-stone-100">
                  <Image
                    src="/products/mango.jpg"
                    alt="Mango"
                    fill
                    sizes="44px"
                    priority
                    className="object-cover"
                  />
                </div>
                <div className="pr-1.5 sm:pr-2">
                  <span className="text-[9px] sm:text-[10px] text-stone-500 font-bold block">সিজনাল বাছাই</span>
                  <span className="text-[11px] sm:text-xs font-black text-emerald-950 block">মিষ্টি পাকা আম 🥭</span>
                </div>
              </div>

              {/* Floating Gur Card (Hidden on mobile screens to prevent overlap with rating badge) */}
              <div className="hidden sm:flex absolute -bottom-3 -left-4 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-stone-200/90 items-center gap-2.5 z-20 hover:scale-105 transition-transform">
                <div className="w-11 h-11 rounded-xl overflow-hidden relative border border-amber-200 flex-shrink-0 bg-stone-100">
                  <Image
                    src="/products/gur.jpg"
                    alt="Gur"
                    fill
                    sizes="44px"
                    priority
                    className="object-cover"
                  />
                </div>
                <div className="pr-2">
                  <span className="text-[10px] text-stone-500 font-bold block">ঐতিহ্যবাহী</span>
                  <span className="text-xs font-black text-amber-900 block">খাঁটি খেজুরের গুড় 🏺</span>
                </div>
              </div>

              {/* Social Proof Badge */}
              <div className="absolute -bottom-3 -right-2 sm:-right-4 bg-emerald-950/95 backdrop-blur-md text-white px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl shadow-2xl border border-emerald-700/70 z-20 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-sm sm:text-base shadow flex-shrink-0">
                  ★
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-black text-[11px] sm:text-xs">
                    <span>৪.৯ / ৫.০</span>
                    <span className="text-stone-300 font-normal text-[10px] sm:text-[11px]">(সন্তুষ্ট ক্রেতা)</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-emerald-200 font-medium">১০০% প্রাকৃতিক গুণমান</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div id="products-section" className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          {/* Category Pills with Dynamic Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categoriesList.map((cat) => {
              const count = getCategoryCount(cat);
              const label = cat === "ALL" ? "সব পণ্য" : cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCat === cat
                      ? "bg-emerald-800 text-white shadow-md scale-[1.02]"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCat === cat
                        ? "bg-emerald-950 text-amber-300"
                        : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
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
              const isOutOfStock = p.stock <= 0;
              const isLowStock = !isOutOfStock && p.stock <= 5;
              const isExpanded = !!expandedDesc[p.id];

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${
                    isOutOfStock ? "border-stone-300/80 opacity-90" : "border-stone-200/80"
                  }`}
                >
                  <div>
                    {/* Product Image Container with Next.js Image */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-4">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                            isOutOfStock ? "grayscale-[40%]" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 text-6xl">
                          {p.icon || "🍯"}
                        </div>
                      )}

                      {/* Top-Left Category / Status Badge */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                        {isOutOfStock ? (
                          <span className="bg-rose-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            স্টক শেষ
                          </span>
                        ) : p.isSeasonal ? (
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

                    {/* Product Title */}
                    <h3 className="font-extrabold text-lg text-stone-900 group-hover:text-emerald-900 transition-colors">
                      {p.name}
                    </h3>

                    {/* Product Description with Expand Toggle */}
                    <div className="mt-1">
                      <p
                        className={`text-xs text-stone-500 leading-relaxed ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {p.description || "১০০% নির্ভেজাল ও স্বাস্থ্যসম্মত খাঁটি দেশীয় পণ্য।"}
                      </p>
                      {p.description && p.description.length > 70 && (
                        <button
                          type="button"
                          onClick={() => toggleDescription(p.id)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 mt-0.5 inline-flex items-center gap-0.5"
                        >
                          <span>{isExpanded ? "সংক্ষেপ করুন" : "আরো পড়ুন"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Size Selector Pills (or out of stock notification) */}
                    <div className="mt-4">
                      {isOutOfStock ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>এই পণ্যটি বর্তমানে অনুপলব্ধ। দ্রুত পুনরায় স্টকে আনা হবে।</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                              {p.category === "গুড়" || p.name.includes("গুড়")
                                ? "ধরণ ও সাইজ নির্বাচন"
                                : "সাইজ নির্বাচন"}
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
                                  onClick={() =>
                                    setSelectedVariants((prev) => ({ ...prev, [p.id]: v }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isSelected
                                      ? "bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-700/30 scale-[1.02]"
                                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                                  }`}
                                >
                                  <span>{v.unit}</span>
                                  <span
                                    className={`text-[10px] ${
                                      isSelected
                                        ? "text-emerald-200 font-extrabold"
                                        : "text-stone-500"
                                    }`}
                                  >
                                    ৳{v.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Area: Pricing, Quantity Stepper & Buttons */}
                  <div className="mt-5 pt-3.5 border-t border-stone-100 space-y-3.5">
                    {/* Price & Stock Indicator Row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-emerald-950 tracking-tight">
                            ৳{activeVariant.price}
                          </span>
                          <span className="text-xs text-stone-500 font-medium">
                            / {activeVariant.unit}
                          </span>
                        </div>

                        {/* If Qty > 1, show multiplied total */}
                        {cardQty > 1 && !isOutOfStock && (
                          <div className="text-[11px] font-bold text-amber-800">
                            মোট: ৳{activeVariant.price * cardQty} ({cardQty} টি)
                          </div>
                        )}

                        {/* Accurate Stock Status */}
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-1">
                          {isOutOfStock ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span className="text-rose-600">স্টক শেষ (Out of Stock)</span>
                            </>
                          ) : isLowStock ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              <span className="text-amber-700 font-bold">
                                মাত্র {p.stock} টি স্টকে অবশিষ্ট!
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-emerald-700">স্টকে আছে ({p.stock} টি)</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper (hidden if out of stock) */}
                      {!isOutOfStock && (
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
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <a
                        href={
                          isOutOfStock
                            ? "#"
                            : `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                                `আসসালামু আলাইকুম, আমি "${p.name} (${activeVariant.unit}) x ${cardQty} = ৳${activeVariant.price * cardQty}" অর্ডার করতে চাচ্ছি।`
                              )}`
                        }
                        target={isOutOfStock ? "_self" : "_blank"}
                        rel="noreferrer"
                        title={isOutOfStock ? "পণ্যটি স্টকে নেই" : "WhatsApp-এ অর্ডার"}
                        onClick={(e) => {
                          if (isOutOfStock) {
                            e.preventDefault();
                            addToast("error", `দুঃখিত, "${p.name}" বর্তমানে স্টক শেষ!`);
                          }
                        }}
                        className={`px-3.5 py-2.5 rounded-xl border transition flex items-center justify-center shadow-sm active:scale-95 ${
                          isOutOfStock
                            ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                            : "border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </a>

                      <button
                        onClick={() => addToCart(p, activeVariant, cardQty)}
                        disabled={isOutOfStock}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 ${
                          isOutOfStock
                            ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                            : addedItemKey === `${p.id}_${activeVariant.unit}`
                            ? "bg-amber-500 text-emerald-950 scale-[1.02]"
                            : "bg-emerald-800 hover:bg-emerald-900 text-white"
                        }`}
                      >
                        {isOutOfStock ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-stone-400" />
                            <span>স্টক শেষ</span>
                          </>
                        ) : addedItemKey === `${p.id}_${activeVariant.unit}` ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                            <span>যোগ হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            <span>কার্টে যোগ করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== JSON-LD STRUCTURED DATA (SEO & AI OVERVIEWS) ==================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "OnlineStore",
              "@id": "https://shomvar.smanas.net/#store",
              name: tenant.name || "খাঁটি সম্ভার",
              alternateName: [
                "Khati Shombhar",
                "Khati Shomvar",
                "খাঁটি সম্ভার বাংলাদেশ",
                "shomvar.smanas.net",
                "খাঁটি সম্ভার অনলাইন শপ",
              ],
              url: "https://shomvar.smanas.net",
              logo: "https://shomvar.smanas.net/products/honey.jpg",
              image: "https://shomvar.smanas.net/products/honey.jpg",
              description:
                tenant.tagline ||
                "১০০% খাঁটি প্রাকৃতিক মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড়ের বিশ্বস্ত অনলাইন শপ।",
              telephone: tenant.whatsapp || "+8801700000000",
              priceRange: "৳৳",
              currenciesAccepted: "BDT",
              paymentAccepted: "Cash on Delivery, bKash, Nagad",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Rajshahi",
                addressRegion: "Rajshahi",
                addressCountry: "BD",
              },
              areaServed: {
                "@type": "Country",
                name: "Bangladesh",
              },
              knowsAbout: [
                "খাঁটি মধু (Pure Honey)",
                "সুন্দরবনের মধু",
                "রাজশাহীর মিষ্টি আম (Rajshahi Mango)",
                "হিমসাগর আম",
                "ল্যাংড়া আম",
                "আম্রপালি",
                "খাঁটি খেজুরের গুড় (Pure Khejur Gur)",
                "পাটালি গুড়",
                "প্রাকৃতিক ও অর্গানিক খাদ্যোপাদান",
              ],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "খাঁটি সম্ভার — প্রাকৃতিক ও নির্ভেজাল পণ্য তালিকা",
              itemListElement: tenant.products.map((p, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                item: {
                  "@type": "Product",
                  name: p.name,
                  image: p.image
                    ? p.image.startsWith("http")
                      ? p.image
                      : `https://shomvar.smanas.net${p.image}`
                    : "https://shomvar.smanas.net/products/honey.jpg",
                  description:
                    p.description ||
                    `${p.name} — ১০০% খাঁটি, প্রাকৃতিক ও রাসায়নিকমুক্ত নির্ভেজাল দেশীয় উপাদান।`,
                  sku: `KS-${p.id}`,
                  brand: {
                    "@type": "Brand",
                    name: "খাঁটি সম্ভার",
                  },
                  offers: {
                    "@type": "Offer",
                    url: "https://shomvar.smanas.net",
                    priceCurrency: "BDT",
                    price: p.price,
                    availability:
                      p.stock > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    itemCondition: "https://schema.org/NewCondition",
                    priceValidUntil: "2027-12-31",
                    seller: {
                      "@type": "Organization",
                      name: tenant.name,
                    },
                  },
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "4.9",
                    reviewCount: "148",
                    bestRating: "5",
                  },
                },
              })),
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "খাঁটি মধু (Pure Honey) কীভাবে চিনবেন এবং কেন খাঁটি সম্ভার (shomvar.smanas.net)-এর মধু সেরা?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "খাঁটি মধু পানিতে দিলে সহজে দ্রবীভূত না হয়ে সরাসরি তলানিতে জমাট বাঁধে। খাঁটি সম্ভার (shomvar.smanas.net) সরাসরি সুন্দরবনের মৌয়ালদের চাক ও নিজস্ব বাগানের ফুল থেকে শতভাগ কাঁচা, অপরিশোধিত ও চিনি ছাড়া প্রাকৃতিক মধু ল্যাব-পরীক্ষিত নিশ্চয়তাসহ ক্যাশ অন ডেলিভারিতে সরবরাহ করে।",
                  },
                },
                {
                  "@type": "Question",
                  name: "রাজশাহীর মিষ্টি আম (হিমসাগর, ল্যাংড়া, আম্রপালি) কীভাবে কার্বাইড ও কেমিক্যালমুক্ত অবস্থায় অনলাইনে কিনবেন?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "খাঁটি সম্ভার সরাসরি রাজশাহীর ঐতিহ্যবাহী বাগান থেকে প্রাকৃতিকভাবে গাছপাকা আম সংগ্রহ করে। কোনো কৃত্রিম কার্বাইড বা ফরমালিন দেওয়া হয় না। বিশেষ বায়ুরোধী ঝুড়ি ও অক্ষত প্যাকিংয়ে সারা বাংলাদেশে হোম ডেলিভারি দেওয়া হয়।",
                  },
                },
                {
                  "@type": "Question",
                  name: "খাঁটি খেজুরের গুড় ও পাটালি গুড়ের বৈশিষ্ট্য কী এবং নির্ভেজাল গুড় কীভাবে চেনা যায়?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "খাঁটি খেজুরের গুড়ে কোনো চিনি, ফিটকিরি বা কৃত্রিম রঙ মেশানো হয় না। এর ঘ্রাণ অত্যন্ত মিষ্টি ও স্বাভাবিক এবং মুখে দিলে সহজে মিলিয়ে যায়। খাঁটি সম্ভারের গুড় রাজশাহীর অভিজ্ঞ গাছিদের খাঁটি রস দিয়ে তৈরি।",
                  },
                },
                {
                  "@type": "Question",
                  name: "shomvar.smanas.net থেকে কীভাবে ক্যাশ অন ডেলিভারিতে অর্ডার করবেন?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "shomvar.smanas.net ওয়েবসাইটে গিয়ে পণ্য কার্টে যোগ করুন। চেকআউট ফর্মে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখে 'অর্ডার কনফার্ম করুন' বাটনে ক্লিক করুন। এছাড়া সরাসরি WhatsApp-এও অর্ডার করতে পারেন। পণ্য হাতে পেয়ে চেক করে টাকা দেওয়ার সুযোগ রয়েছে।",
                  },
                },
              ],
            }),
          }}
        />

        {/* ==================== SEMANTIC SEO & GOOGLE AI KNOWLEDGE SECTION ==================== */}
        <section
          id="seo-guide"
          aria-label="খাঁটি প্রাকৃতিক খাদ্য ও সচরাচর জিজ্ঞাসা"
          className="mt-14 mb-8 bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-sm"
        >
          {/* Section Header with Semantic H2 */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 mb-3 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>১০০% খাঁটি ও বিশ্বস্ত প্রাকৃতিক উৎস</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
              খাঁটি মধু, রাজশাহীর আম ও খাঁটি গুড় — কেন{" "}
              <span className="text-emerald-800 underline decoration-amber-400 decoration-wavy">
                shomvar.smanas.net
              </span>{" "}
              সেরা?
            </h2>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">
              আমরা কোনো প্রকার কৃত্রিম রঙ, কেমিক্যাল বা প্রিজারভেটিভ ছাড়া সরাসরি মূল উৎপাদক থেকে খাদ্যপণ্য আপনার ঘরে পৌঁছে দিই।
            </p>
          </div>

          {/* 3 Pillars of Authenticity (Semantic Content) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🍯
              </div>
              <h3 className="font-extrabold text-base text-stone-900 mb-2">
                সুন্দরবনের খাঁটি মধু (Pure Honey)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                কোনো প্রকার প্রসেসিং বা কৃত্রিম চিনি ছাড়া সম্পূর্ণ কাঁচা (Raw) প্রাকৃতিক মধু। সুন্দরবনের খলিশা, গরান ও সরিষা ফুলের নির্ভেজাল মধু যা রোগ প্রতিরোধ ক্ষমতা বাড়াতে সাহায্য করে।
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🥭
              </div>
              <h3 className="font-extrabold text-base text-stone-900 mb-2">
                রাজশাহীর মিষ্টি আম (Chemical-Free Mango)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                গাছপাকা হিমসাগর, ল্যাংড়া, আম্রপালি ও ফজলি আম। কোনো প্রকার ক্ষতিকারক কার্বাইড বা ফরমালিন দেওয়া হয় না। সরাসরি রাজশাহীর বাগান থেকে অক্ষত অবস্থায় সরবরাহ করা হয়।
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🏺
              </div>
              <h3 className="font-extrabold text-base text-stone-900 mb-2">
                ঐতিহ্যবাহী খাঁটি খেজুরের গুড় (Pure Khejur Gur)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                কোনো প্রকার চিনি, হাইড্রোজ বা কৃত্রিম ফ্লেভার ছাড়া খাঁটি খেজুরের রস জ্বাল দিয়ে তৈরি পাটালি ও ঝোলা গুড়। শীতকালীন আসল ঐতিহ্যবাহী পিঠাপুলির স্বাদ ফিরিয়ে দেয়।
              </p>
            </div>
          </div>

          {/* Interactive FAQ Accordion (Extracted by Google AI & Gemini Overviews) */}
          <div className="border-t border-stone-200 pt-8">
            <h3 className="text-lg font-black text-stone-900 text-center mb-6 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-700" />
              <span>সচরাচর জিজ্ঞাসা (Frequently Asked Questions)</span>
            </h3>

            <div className="space-y-3 max-w-3xl mx-auto">
              {[
                {
                  q: "খাঁটি মধু চেনার উপায় কি এবং খাঁটি সম্ভার-এর মধু কেন নির্ভরযোগ্য?",
                  a: "খাঁটি মধু পানিতে দিলে সঙ্গে সঙ্গে গলে যায় না, বরং সুতার মতো নিচে গিয়ে জমাট বাঁধে। খাঁটি সম্ভার (shomvar.smanas.net) সরাসরি সুন্দরবনের রেজিস্টার্ড মৌয়াল ও নিজস্ব বাগান থেকে শতভাগ প্রাকৃতিক মধু সংগ্রহ করে, যাতে কোনো ধরনের কৃত্রিম মিষ্টি বা প্রিজারভেটিভ থাকে না।",
                },
                {
                  q: "রাজশাহীর আম কীভাবে অক্ষত ও ফরমালিনমুক্ত ডেলিভারি করা হয়?",
                  a: "আমরা গাছ থেকে আম পাড়ার পর কোনো প্রকার কার্বাইড বা কেমিক্যাল ব্যবহার করি না। প্রতিটি আম সাবধানে বাছাই করে ফোম ও ক্যারেটে প্যাকিং করে সরাসরি কুরিয়ারের মাধ্যমে পাঠানো হয়, যাতে গ্রাহক ঘরে বসেই বাগানের আসল স্বাদ পান।",
                },
                {
                  q: "খেজুরের গুড়ে কি চিনি বা কেমিক্যাল মেশানো থাকে?",
                  a: "একদমই না। খাঁটি সম্ভারের খেজুরের গুড় ও পাটালি গুড় সম্পূর্ণ চিনি ও ক্ষতিকর রঙ মুক্ত। অভিজ্ঞ গাছিরা সনাতন পদ্ধতিতে গাছ থেকে রস সংগ্রহ করে চুলোয় জ্বাল দিয়ে আসল গুড় তৈরি করেন।",
                },
                {
                  q: "অর্ডার করার নিয়ম এবং ডেলিভারি চার্জ কত?",
                  a: "পণ্য নির্বাচন করে কার্টে যুক্ত করে চেকআউট করুন। রাজশাহী সিটিতে ডেলিভারি চার্জ মাত্র ৳৬০, ঢাকা সিটিতে ৳১০০ এবং সারা বাংলাদেশে ৳১৫০। পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ (ক্যাশ অন ডেলিভারি) করতে পারবেন।",
                },
              ].map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-stone-200 rounded-2xl overflow-hidden transition-all bg-stone-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 font-bold text-sm text-stone-900 hover:text-emerald-900 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{faq.q}</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 bg-white">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ==================== CART DRAWER ==================== */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl border-l border-stone-200"
          >
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
                  aria-label="Close cart"
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
                <div className="divide-y divide-stone-100 my-4 max-h-[44vh] overflow-y-auto pr-1 space-y-1">
                  {cart.map((c) => (
                    <div key={c.cartKey} className="py-3.5 space-y-2.5">
                      <div className="flex justify-between items-start gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 flex items-center justify-center relative">
                            {c.image ? (
                              <Image
                                src={c.image}
                                alt={c.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
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
              <form onSubmit={handleCheckout} className="space-y-3 border-t border-stone-200 pt-3 text-sm">
                <div>
                  <input
                    required
                    placeholder="আপনার পুরো নাম *"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="01[3-9][0-9]{8}"
                    maxLength={11}
                    placeholder="মোবাইল নম্বর (০১৭XXXXXXXX) *"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400 pl-1 mt-0.5 block">
                    সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন
                  </span>
                </div>

                <div>
                  <textarea
                    required
                    rows={2}
                    placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা/উপজেলা) *"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    placeholder="অতিরিক্ত নির্দেশনা বা বিকল্প ফোন নম্বর (ঐচ্ছিক)"
                    value={custNote}
                    onChange={(e) => setCustNote(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-stone-50"
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
                <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 space-y-1.5 text-xs">
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

      {/* Floating Bottom Cart Button */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounceOnce">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-emerald-950 hover:bg-emerald-900 text-white pl-4 pr-3 py-2.5 rounded-2xl shadow-2xl border border-emerald-700/80 flex items-center gap-2.5 transition hover:scale-105 active:scale-95 group"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 text-amber-300" />
              <span className="absolute -top-2 -right-2.5 bg-amber-400 text-emerald-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-100">কার্ট দেখুন</span>
            <span className="text-xs font-black text-amber-300 bg-emerald-900/80 px-2 py-0.5 rounded-lg border border-emerald-800">
              ৳{subTotal}
            </span>
          </button>
        </div>
      )}

      {/* Scroll to Top Floating Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-20 right-6 z-30 w-10 h-10 rounded-full bg-white/90 text-stone-700 hover:text-emerald-900 hover:bg-white shadow-lg border border-stone-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 mt-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-stone-200 text-sm">{tenant.name}</p>
            <p className="mt-1">১০০% প্রাকৃতিক ও খাঁটি উপাদানের বিশ্বস্ত ঠিকানা।</p>
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            <span>© {new Date().getFullYear()} {tenant.name}। সর্বস্বত্ব সংরক্ষিত।</span>
            <span>•</span>
            <a
              href={`/${tenant.slug}/admin`}
              className="text-stone-500 hover:text-amber-400 transition flex items-center gap-1 font-medium"
            >
              🔒 অ্যাডমিন প্রবেশ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
