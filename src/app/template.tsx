/**
 * Root template — remounts with a unique key per navigation (Next.js App Router
 * `template.js` convention), re-firing the `.kg-page-transition` fade-in defined
 * in globals.css so route changes feel seamless (issue 5). Server Component: no
 * state, no 'use client'. Reduced-motion users get no animation (handled in CSS).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="kg-page-transition">{children}</div>;
}
