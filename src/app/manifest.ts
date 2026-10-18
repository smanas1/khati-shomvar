import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "খাঁটি সম্ভার — ১০০% প্রাকৃতিক ও নির্ভেজাল উপাদানের সম্ভার",
    short_name: "খাঁটি সম্ভার",
    description:
      "খাঁটি মধু, রাজশাহীর মিষ্টি আম ও ঐতিহ্যবাহী খেজুরের গুড়ের বিশ্বস্ত অনলাইন শপ। shomvar.smanas.net",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#064e3b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
