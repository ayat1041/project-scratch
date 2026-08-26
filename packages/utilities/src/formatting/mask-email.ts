export function maskEmail(email: string | null): string {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    const visible = name.slice(0, 2);
    const masked = '*'.repeat(name.length - 2);
    return `${visible}${masked}@${domain}`;
}