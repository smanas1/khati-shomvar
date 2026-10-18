import type { Metadata } from "next";
import { Hind_Siliguri, Geist_Mono } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "খাঁটি সম্ভার (Khati Shombhar) - ১০০% প্রাকৃতিক ও খাঁটি উপাদানের সম্ভার",
  description:
    "১০০% খাঁটি প্রাকৃতিক মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড়ের বিশ্বস্ত প্রতিষ্ঠান।",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${hindSiliguri.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
