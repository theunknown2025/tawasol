import { useCallback } from "react";
import {
  SignedStorageFileAccess,
  type SignedStorageFileAccessProps,
} from "@/components/files/SignedStorageFileAccess";
import { getApplicationFileSignedUrl } from "@/lib/opportunitiesApi";

type ApplicationFileLinkProps = {
  path: string;
  fileName: string;
};

export default function ApplicationFileLink({ path, fileName }: ApplicationFileLinkProps) {
  const getSignedUrl = useCallback<SignedStorageFileAccessProps["getSignedUrl"]>(
    (storagePath) => getApplicationFileSignedUrl(storagePath),
    []
  );

  return (
    <SignedStorageFileAccess path={path} fileName={fileName} getSignedUrl={getSignedUrl} />
  );
}
