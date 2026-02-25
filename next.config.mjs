/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'pub-61324df0878a4393803edca8e43e57c4.r2.dev',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'supabase.grupocilar.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'pub-2b7c10c04cbb4824bc36f52820ace933.r2.dev',
                pathname: '/**',
            }
        ],
    },
};

export default nextConfig;
