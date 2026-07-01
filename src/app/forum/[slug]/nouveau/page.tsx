import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getForumCategory } from "@/lib/db";
import { getSession } from "@/lib/session";
import NewTopicForm from "@/components/forum/NewTopicForm";
import BackButton from "@/components/forum/BackButton";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = await getForumCategory(slug);
  return { title: cat ? `Nouveau sujet — ${cat.name}` : "Nouveau sujet" };
}

export default async function NewTopicPage({ params }: Props) {
  const { slug } = await params;

  const [category, session] = await Promise.all([
    getForumCategory(slug),
    getSession(),
  ]);

  if (!category) notFound();
  if (!session)  redirect(`/?loginModal=1&returnTo=/forum/${slug}/nouveau`);

  return (
    <div>
      <BackButton />

      {/* Fil d'Ariane */}
      <nav className="text-xs text-faint mb-6 flex items-center gap-1.5">
        <Link href="/forum" className="hover:text-[#c8a32e]">Forum</Link>
        <span>/</span>
        <Link href={`/forum/${slug}`} className="hover:text-[#c8a32e]">{category.name}</Link>
        <span>/</span>
        <span className="text-muted">Nouveau sujet</span>
      </nav>

      <h1 className="text-2xl font-bold text-foreground mb-8">Nouveau sujet</h1>

      <NewTopicForm slug={slug} />
    </div>
  );
}
