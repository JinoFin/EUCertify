import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getLocale } from '@/lib/i18n';

interface KnowledgePageProps {
  params: { act: string; version: string };
  searchParams?: { lang?: string };
}

export default async function KnowledgePage({ params, searchParams }: KnowledgePageProps) {
  const locale = searchParams?.lang ?? (await getLocale());
  const filePath = path.join(process.cwd(), 'knowledge', locale, params.act, `${params.version}.mdx`);

  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { content } = await compileMDX({ source });
    return <article className="mx-auto max-w-4xl px-4 py-10 mdx-content">{content}</article>;
  } catch (error) {
    notFound();
  }
}
