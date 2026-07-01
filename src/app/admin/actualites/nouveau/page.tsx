import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createArticleAction } from "@/app/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";
import { requireBOAccess } from "@/lib/auth-check";

export const metadata = { title: "Nouvel article" };

export default async function NouvelArticlePage() {
  await requireBOAccess();

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
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Nouvel article</h1>
      </div>

      <div className="bg-surface border border-border-site rounded-lg p-6">
        <ArticleForm action={createArticleAction} mode="create" />
      </div>
    </div>
  );
}
