import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/
});

const nextConfig = {
  experimental: {
    appDir: true
  },
  pageExtensions: ['tsx', 'ts', 'js', 'jsx', 'mdx'],
  i18n: {
    locales: ['de', 'en', 'zh-CN'],
    defaultLocale: 'de'
  }
};

export default withMDX(nextConfig);
