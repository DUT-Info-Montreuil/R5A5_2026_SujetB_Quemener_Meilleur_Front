export function parseId(value: string | undefined): number | null {
    if (!value) return null;
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
}