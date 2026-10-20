import disposableDomainList from "disposable-email-domains";
import { isDisposableEmailDomain } from "@/lib/preview-request";

const DISPOSABLE_DOMAINS = new Set<string>(disposableDomainList);

export function domainIsDisposable(domain: string): boolean {
  return isDisposableEmailDomain(domain, DISPOSABLE_DOMAINS);
}
