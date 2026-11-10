import { usePageTitle } from "../lib/usePageTitle";

export function Placeholder({ title }: { title: string }) {
  usePageTitle(title);
  return (
    <>
      <div className="page-head">
        <h1>{title}</h1>
      </div>
      <div className="panel">
        <p>This page is built in the next step.</p>
      </div>
    </>
  );
}
