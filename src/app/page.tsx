// src/app/page.tsx
import type { Metadata } from "next";
import { getOrInitTenant } from "@/app/actions";
import StorefrontClient from "./[tenantSlug]/StorefrontClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shomvar.smanas.net";
  const title = "খাঁটি সম্ভার — খাঁটি মধু, রাজশাহীর আম ও খাঁটি গুড়ের বিশ্বস্ত প্রতিষ্ঠান";
  const description =
    "১০০% খাঁটি প্রাকৃতিক মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড় কিনুন সরাসরি মৌয়াল ও বাগান থেকে। সারাদেশে ক্যাশ অন ডেলিভারি। shomvar.smanas.net";

  return {
    title,
    description,
    keywords: [
      "খাঁটি মধু",
      "pure honey bangladesh",
      "সুন্দরবনের মধু",
      "রাজশাহীর আম",
      "rajshahi mango online",
      "হিমসাগর আম",
      "ল্যাংড়া আম",
      "আম্রপালি",
      "খাঁটি খেজুরের গুড়",
      "khejur gur online bd",
      "পাটালি গুড়",
      "ঝোলা গুড়",
      "প্রাকৃতিক খাদ্য",
      "organic food bd",
      "খাঁটি সম্ভার",
      "shomvar.smanas.net",
    ],
    authors: [{ name: "খাঁটি সম্ভার (Khati Shombhar)", url: baseUrl }],
    creator: "খাঁটি সম্ভার",
    publisher: "খাঁটি সম্ভার",
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: "খাঁটি সম্ভার",
      locale: "bn_BD",
      type: "website",
      images: [
        {
          url: `${baseUrl}/products/honey.jpg`,
          width: 1200,
          height: 630,
          alt: "খাঁটি সম্ভার - ১০০% প্রাকৃতিক খাদ্যোপাদান",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/products/honey.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function HomePage() {
  const tenant = await getOrInitTenant("khati-shombhar");

  return <StorefrontClient tenant={tenant} />;
}
