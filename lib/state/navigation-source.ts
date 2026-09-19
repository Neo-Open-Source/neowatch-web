let pendingHeaderNav: string | null = null;

export function markHeaderNav(href: string): void {
  pendingHeaderNav = href;
}

export function consumeHeaderNav(pathname: string): boolean {
  const fromHeader = pendingHeaderNav === pathname;
  pendingHeaderNav = null;
  return fromHeader;
}
