import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/a/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/f/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "nrixq6e1fl.ufs.sh",
        port: "",
        pathname: "/f/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
