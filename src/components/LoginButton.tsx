"use client";

interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function LoginButton({ className, children }: Props) {
  function open() {
    window.dispatchEvent(new CustomEvent("open-login"));
  }
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
