/** @param {NS} ns */
export async function main(ns) {
    let o = new Date();
    while (true) {
        await ns.sleep(1000);
        const n = new Date();
        ns.tprintf(n.toISOString() + " pass " + ( n-o ) + " ms");
        o = n;
    }
}