// src/app/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ─── Auth Helper ───────────────────────────────────────────────────────────────
async function requireAdmin() {
  const cookieStore = await cookies();
  if (cookieStore.get("khati_admin_session")?.value !== "authenticated") {
    throw new Error("অননুমোদিত অ্যাক্সেস! শুধুমাত্র অ্যাডমিনরা এই কাজ করতে পারবেন।");
  }
}

// ─── 1. টেন্যান্ট লোড করা ────────────────────────────────────────────────────
export async function getOrInitTenant(rawSlug: string = "khati-shombhar") {
  // Sanitize slug
  const cleanSlug = rawSlug.trim().toLowerCase();
  const isInvalid =
    !cleanSlug ||
    cleanSlug.includes(".") ||
    cleanSlug.includes("\\") ||
    cleanSlug.includes("/") ||
    ["favicon.ico", "favicon.png", "icon.png", "icon.svg", "image", "admin", "api"].includes(cleanSlug);

  const slug = isInvalid ? "khati-shombhar" : cleanSlug;

  let tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      products: { orderBy: { createdAt: "desc" } },
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug,
        name: slug === "khati-shombhar" ? "খাঁটি সম্ভার" : slug.toUpperCase(),
        tagline: "১০০% প্রাকৃতিক ও খাঁটি উপাদানের সম্ভার",
        whatsapp: "8801700000000",
        products: {
          create: [
            {
              name: "১০০% খাঁটি প্রাকৃতিক মধু",
              category: "মধু",
              unit: "৫০০ মিলি",
              price: 650,
              stock: 30,
              icon: "🍯",
              image: "/products/honey.jpg",
              variants: JSON.stringify([
                { unit: "৫০০ মিলি", price: 650 },
                { unit: "১ লিটার", price: 1250 },
                { unit: "২ লিটার", price: 2400 },
              ]),
              description: "সরাসরি মৌচাক থেকে সংগৃহীত ১০০% খাঁটি ও প্রাকৃতিক মধু। কোনো কেমিক্যাল বা ভেজাল নেই।",
            },
            {
              name: "রাজশাহীর বাছাইকৃত মিষ্টি আম",
              category: "আম",
              unit: "৫ কেজি",
              price: 450,
              stock: 50,
              isSeasonal: true,
              icon: "🥭",
              image: "/products/mango.jpg",
              variants: JSON.stringify([
                { unit: "৫ কেজি", price: 450 },
                { unit: "১০ কেজি", price: 850 },
                { unit: "২০ কেজি", price: 1600 },
              ]),
              description: "সম্পূর্ণ প্রাকৃতিকভাবে গাছপাকা, মিষ্টি ও সুস্বাদু সেরা জাতের আম।",
            },
            {
              name: "১০০% খাঁটি খেজুরের গুড়",
              category: "গুড়",
              unit: "পাটালি (৫০০ গ্রাম)",
              price: 220,
              stock: 40,
              isSeasonal: true,
              icon: "🏺",
              image: "/products/gur.jpg",
              variants: JSON.stringify([
                { unit: "পাটালি (৫০০ গ্রাম)", price: 220 },
                { unit: "পাটালি (১ কেজি)", price: 420 },
                { unit: "ঝোলা গুড় (১ কেজি)", price: 450 },
                { unit: "দানা গুড় (১ কেজি)", price: 450 },
              ]),
              description: "কোনো চিনি, হাইড্রোজ বা কেমিক্যাল ছাড়া তৈরি খাঁটি খেজুরের গুড়।",
            },
          ],
        },
      },
      include: {
        products: { orderBy: { createdAt: "desc" } },
        orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
      },
    });
  }

  return tenant;
}

// ─── 2. নতুন প্রোডাক্ট যোগ করা (Admin) ────────────────────────────────────
export async function createProductAction(tenantId: string, slug: string, formData: FormData) {
  await requireAdmin();
  const imageUrl = String(formData.get("image") || "").trim();
  const variantsRaw = String(formData.get("variants") || "").trim();
  await prisma.product.create({
    data: {
      tenantId,
      name: String(formData.get("name")),
      category: String(formData.get("category")),
      unit: String(formData.get("unit")),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      icon: String(formData.get("icon") || "🍯"),
      image: imageUrl || null,
      variants: variantsRaw || null,
      description: String(formData.get("description") || ""),
      isSeasonal: formData.get("isSeasonal") === "on",
    },
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 3. প্রোডাক্ট ডিলিট করা (Admin) ────────────────────────────────────────
export async function deleteProductAction(productId: string, slug: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 4. প্রোডাক্ট স্টক/মূল্য আপডেট (Admin) ─────────────────────────────────
export async function updateProductAction(
  productId: string,
  slug: string,
  data: { stock?: number; price?: number; name?: string; description?: string }
) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data,
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 5. কাস্টমার অর্ডার সাবমিট করা ─────────────────────────────────────────
export async function placeOrderAction(payload: {
  tenantId: string;
  slug: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryArea: string;
  deliveryCharge: number;
  paymentMethod: string;
  items: { productId: string; productName: string; unit: string; quantity: number; unitPrice: number }[];
}) {
  const subTotal = payload.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalAmount = subTotal + payload.deliveryCharge;
  const orderNumber = "KS-" + Math.floor(100000 + Math.random() * 900000);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      tenantId: payload.tenantId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      shippingAddress: payload.shippingAddress,
      deliveryArea: payload.deliveryArea,
      deliveryCharge: payload.deliveryCharge,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      items: { create: payload.items },
    },
  });

  for (const item of payload.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  revalidatePath(`/${payload.slug}`);
  revalidatePath(`/${payload.slug}/admin`);
  return { success: true, orderNumber: order.orderNumber };
}

// ─── 6. অর্ডারের স্ট্যাটাস পরিবর্তন (Admin) ─────────────────────────────────
export async function updateOrderStatusAction(orderId: string, status: string, slug: string) {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 7. স্টোরের সেটিংস আপডেট (Admin) ────────────────────────────────────────
export async function updateTenantSettingsAction(tenantId: string, slug: string, formData: FormData) {
  await requireAdmin();
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: String(formData.get("name")),
      tagline: String(formData.get("tagline") || ""),
      whatsapp: String(formData.get("whatsapp")),
      deliveryLocal: Number(formData.get("deliveryLocal")),
      deliveryDhaka: Number(formData.get("deliveryDhaka")),
      deliveryOutside: Number(formData.get("deliveryOutside")),
    },
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 8. অ্যাডমিন পাসওয়ার্ড ভেরিফিকেশন ────────────────────────────────────
export async function verifyAdminPasswordAction(password: string): Promise<{ success: boolean; error?: string }> {
  const correctPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set("khati_admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    });
    return { success: true };
  }
  return { success: false, error: "ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।" };
}

// ─── 9. অ্যাডমিন লগআউট ───────────────────────────────────────────────────────
export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete("khati_admin_session");
  return { success: true };
}

// ─── 10. অ্যাডমিন অথেন্টিকেশন চেক ──────────────────────────────────────────
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("khati_admin_session")?.value === "authenticated";
}
