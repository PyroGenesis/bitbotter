import { NS } from "@ns";

export class LogEntry {
	values: string[] = []; 
	sort_field = 0;
}

export class LogEntries {
	private _logs: LogEntry[] = [];	
	public get logs(): LogEntry[] {
		return this._logs;
	}

	private _log_length = 0	
	public get log_length(): number {
		return this._log_length;
	}	

	to_sort = false;
	
	addLog(log: LogEntry) {
		this._logs.push(log);
		this._log_length = Math.max(this._log_length, log.values.length);
	}
}


/**
 * @param {NS} ns 
 * @param {LogEntry[]} log_entries
 */
export function printClean(ns: NS, log_entries: LogEntries) {
	// let entries = values.length;
	const cols = log_entries.log_length;
	const col_lengths = Array(cols).fill(0);

	// let start = 0
	if (log_entries.to_sort) {
		log_entries.logs.sort((a, b) => b.sort_field - a.sort_field);
		// start++;
	}


	// calc max col lengths
	for (const entry of log_entries.logs) {
		for (let j = 0; j < entry.values.length; j++) {
			col_lengths[j] = Math.max(col_lengths[j], entry.values[j].length);
		}
	}

	// print
	for (const entry of log_entries.logs) {
		const print_str = [];
		for (let j = 0; j < entry.values.length; j++) {
			print_str.push(entry.values[j].padEnd(col_lengths[j] + 1))
		}
		ns.print(print_str.join(''));
	}
}