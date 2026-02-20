/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    // Disable Next.js image optimization since it doesn't work in static export without a custom loader
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
