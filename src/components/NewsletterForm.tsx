"use client";

export default function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex gap-0"
    >
      <input
        type="email"
        placeholder="Votre email"
        className="flex-1 bg-[#0d1527] border border-[#1c2d47] text-white text-sm px-3 py-2.5 rounded-l outline-none focus:border-[#c8a32e] transition-colors placeholder:text-gray-600 min-w-0"
      />
      <button
        type="submit"
        className="bg-[#c8a32e] hover:bg-[#e5bb44] text-[#080e1a] px-3 py-2.5 rounded-r transition-colors shrink-0"
        aria-label="S'abonner"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4z" />
        </svg>
      </button>
    </form>
  );
}
