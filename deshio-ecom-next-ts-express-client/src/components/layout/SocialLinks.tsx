import {
  AtSign,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Pin,
  Send,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

const SOCIALS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "x", label: "X (Twitter)", icon: Twitter },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "tiktok", label: "TikTok", icon: Music2 },
  { key: "pinterest", label: "Pinterest", icon: Pin },
  { key: "threads", label: "Threads", icon: AtSign },
  { key: "telegram", label: "Telegram", icon: Send },
  { key: "messenger", label: "Messenger", icon: MessageCircle },
];

function toHref(key: string, value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (key === "messenger") return `https://m.me/${v.replace(/^@/, "")}`;
  return `https://${v}`;
}

export default function SocialLinks({
  links,
}: {
  links?: Record<string, string | undefined>;
}) {
  const items = SOCIALS.filter((s) => links?.[s.key]?.trim());
  if (items.length === 0) return null;

  return (
    <div className="pt-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-stone-900 mb-3">
        Follow Us
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <a
              href={toHref(key, links![key]!)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-all hover:-translate-y-0.5 hover:border-stone-900 hover:bg-stone-900 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
