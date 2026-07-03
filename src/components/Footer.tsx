import Link from "next/link";
import Image from "next/image";
import DiscordIcon from "@/components/DiscordIcon";
import { getSettings } from "@/lib/db";
import { APP_VERSION } from "@/lib/version";

const footerLinks = {
  jeux: [
    { label: "Age of Empires II: DE", href: "/aoe2" },
    { label: "Age of Empires III: DE", href: "/aoe3" },
    { label: "Age of Empires IV", href: "/aoe4" },
    { label: "Age of Mythology: Retold", href: "/aom-retold" },
  ],
  ressources: [
    { label: "Guides", href: "/guides" },
    { label: "Build Orders", href: "/guides/build-orders" },
    { label: "Civilisations", href: "/guides/civilisations" },
    { label: "Conseils & Astuces", href: "/guides/astuces" },
  ],
};

export default async function Footer() {
  const { discordInvite } = await getSettings();

  const communauteLinks = [
    { label: "Discord", href: discordInvite },
    { label: "Tournois", href: "/communaute/tournois" },
    { label: "Événements", href: "/communaute/evenements" },
    { label: "Partenaires", href: "/communaute/partenaires" },
  ];

  const socialLinks = [
    {
      label: "Discord",
      href: discordInvite,
      icon: <DiscordIcon size={18} />,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@ageofempiresfrance",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      label: "Twitch",
      href: "https://www.twitch.tv/age_of_empires_france",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-surface-3 border-t border-border-site">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-10">
          {/* Brand */}
          <div className="flex-1 min-w-[200px]">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/logo.png"
                alt="Age of Empires France"
                width={56}
                height={56}
                className="site-logo"
              />
            </Link>
            <p className="text-faint text-xs leading-relaxed mb-5">
              Le point de ralliement des joueurs francophones passionnés par les jeux Age of Empires.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-faint hover:text-[#c8a32e] transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Jeux */}
          <div className="flex-1 min-w-[140px]">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#c8a32e] mb-4">JEUX</h3>
            <ul className="space-y-2.5">
              {footerLinks.jeux.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-faint hover:text-[#c8a32e] text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div className="flex-1 min-w-[140px]">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#c8a32e] mb-4">RESSOURCES</h3>
            <ul className="space-y-2.5">
              {footerLinks.ressources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-faint hover:text-[#c8a32e] text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Communauté */}
          <div className="flex-1 min-w-[140px]">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#c8a32e] mb-4">COMMUNAUTÉ</h3>
            <ul className="space-y-2.5">
              {communauteLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.label === "Discord" ? "_blank" : undefined}
                    rel={link.label === "Discord" ? "noopener noreferrer" : undefined}
                    className="text-faint hover:text-[#c8a32e] text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border-site">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-faint text-xs">
            © 2026 Age of Empires France. Tous droits réservés.{" "}
            <span className="text-faint/50">v{APP_VERSION}</span>
          </p>
          <div className="flex items-center gap-4">
            <Link href="/mentions-legales" className="text-faint hover:text-muted text-xs transition-colors">
              Mentions légales
            </Link>
            <Link href="/politique-de-confidentialite" className="text-faint hover:text-muted text-xs transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/contact" className="text-faint hover:text-muted text-xs transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
