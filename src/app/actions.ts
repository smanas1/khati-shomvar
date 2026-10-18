// src/app/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ১. টেন্যান্ট লোড করা (না থাকলে অটোমেটিক "খাঁটি সম্ভার" তৈরি হবে)
export async function getOrInitTenant(slug: string = "khati-shombhar") {
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
              description: "সম্পূর্ণ প্রাকৃতিকভাবে গাছপাকা, মিষ্টি ও সুস্বাদু সেরা জাতের আম। কোনো কার্বাইড বা কেমিক্যাল ছাড়া সরাসরি বাগান থেকে সংগৃহীত।",
            },
            {
              name: "১০০% খাঁটি খেজুরের গুড়",
              category: "গুড়",
              unit: "পাটালি (৫০০ গ্রাম)",
              price: 220,
              stock: 40,
              isSeasonal: true,
              icon: "🏺",
              image: "/products/gur.jpg",
              variants: JSON.stringify([
                { unit: "পাটালি (৫০০ গ্রাম)", price: 220 },
                { unit: "পাটালি (১ কেজি)", price: 420 },
                { unit: "ঝোলা গুড় (১ কেজি)", price: 450 },
                { unit: "দানা গুড় (১ কেজি)", price: 450 },
              ]),
              description: "কোনো চিনি, হাইড্রোজ বা কেমিক্যাল ছাড়া তৈরি খাঁটি খেজুরের গুড়। আপনার পছন্দমতো ঐতিহ্যবাহী পাটালি, সুস্বাদু ঝোলা কিংবা দানা গুড়।",
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

// ২. নতুন প্রোডাক্ট যোগ করা (Admin)
export async function createProductAction(tenantId: string, slug: string, formData: FormData) {
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
}

// ৩. প্রোডাক্ট ডিলিট করা (Admin)
export async function deleteProductAction(productId: string, slug: string) {
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath(`/${slug}`);
}

// ৪. কাস্টমার অর্ডার সাবমিট করা
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
      items: {
        create: payload.items,
      },
    },
  });

  // স্টক আপডেট করা
  for (const item of payload.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  revalidatePath(`/${payload.slug}`);
  return { success: true, orderNumber: order.orderNumber };
}

// ৫. অর্ডারের স্ট্যাটাস পরিবর্তন করা (Admin)
export async function updateOrderStatusAction(orderId: string, status: string, slug: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  revalidatePath(`/${slug}`);
}

// ৬. স্টোরের WhatsApp ও ডেলিভারি সেটিংস আপডেট (Admin)
export async function updateTenantSettingsAction(tenantId: string, slug: string, formData: FormData) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: String(formData.get("name")),
      whatsapp: String(formData.get("whatsapp")),
      deliveryLocal: Number(formData.get("deliveryLocal")),
      deliveryDhaka: Number(formData.get("deliveryDhaka")),
      deliveryOutside: Number(formData.get("deliveryOutside")),
    },
  });
  revalidatePath(`/${slug}`);
}
