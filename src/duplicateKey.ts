/**
 * The key a duplicated resource starts with: its source's key plus "Copy",
 * numbered from 2 once that is taken, because a resx cannot hold two entries
 * under one key. Compared ordinally, as the editors' own duplicate check is.
 */
export class DuplicateKey {
    public static readonly suffix = "Copy";

    public static for(key: string, existingKeys: Iterable<string>): string {
        const taken = new Set(existingKeys);
        const candidate = `${key}${DuplicateKey.suffix}`;
        if (taken.has(candidate) === false) {
            return candidate;
        }

        let number = 2;
        while (taken.has(`${candidate}${number}`)) {
            number++;
        }

        return `${candidate}${number}`;
    }
}
