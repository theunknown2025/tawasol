import { useEffect, useState } from "react";
import { getApplicationFileSignedUrl } from "@/lib/opportunitiesApi";

type ApplicationFileLinkProps = {
  path: string;
  fileName: string;
};

export default function ApplicationFileLink({ path, fileName }: ApplicationFileLinkProps) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getApplicationFileSignedUrl(path)
      .then((url) => {
        if (!cancelled) setHref(url);
      })
      .catch(() => {
        if (!cancelled) setHref(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!href) return <span className="text-sm">{fileName}</span>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
      {fileName}
    </a>
  );
}
