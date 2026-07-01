import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getArticle } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { updateArticleAction } from "@/app/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);
  return { title: article ? `Modifier : ${article.title}` : "Article introuvable" };
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, session] = await Promise.all([getArticle(id), requireBOAccess()]);
  if (!article) notFound();

  const boundAction = updateArticleAction.bind(null, id);
  const isAdmin    = session?.role === "admin";
  const canDelete  = isAdmin;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/actualites"
          className="inline-flex items-center gap-1.5 text-faint hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour aux actualités
        </Link>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Modifier l&apos;article</h1>
        <p className="text-faint text-sm mt-1 truncate">{article.title}</p>
      </div>

      <div className="bg-surface border border-border-site rounded-lg p-6">
        <ArticleForm action={boundAction} article={article} mode="edit" canDelete={canDelete} />
      </div>
    </div>
  );
}
