import { NS } from "@ns";
import { CITIES, JOBS } from "corp/constants"

/** 
 * @param {NS} ns 
*/
function printArgs(ns: NS) {
	ns.tprint("Arguments needed for manual_bulk.js");
	ns.tprint("<industry>                      Industry to buy for");
	ns.tprint("-a <aevum_employees>|<split>    Optional. Number of employees to have at Aevum. You can also provide a split: (Eg: 9|auto OR 9|3,2,2,2,0)");
	ns.tprint("-o <other_employees>|<split>    Optional. Number of employees to have at other cities. You can also provide a split: (Eg: 9|auto OR 9|3,2,2,2,0)");
}

/** @param {NS} ns */
export async function main(ns: NS) {
	// help
	if (ns.args.length === 1 && ns.args[0] === 'help') {
		printArgs(ns);
		return;
	}

	// check for required arguments
	if (ns.args.length < 3) {
		ns.print("Not enough arguments");
		return;
	}
    const industry = ns.args[0] as string;

	// Optional args
	let aevum_employees = 0;
	let other_employees = 0;
	let aevum_split = null;
	let other_split = null;

	for (let i = 1; i < ns.args.length; i++) {
		switch(ns.args[i]) {
			case '-a': {
				if (i+1 > ns.args.length) {
					ns.print("Please provide the aevum employees after the -a argument");
					ns.tail();
					return;
				}
				const ae_full = ns.args[i+1] as string;
				if (!ae_full.includes('|')) {
					ns.print("Invalid Aevum employees: No divider (|)");
					ns.tail();
					return;
				}
				const ae_split = ae_full.split('|');				
				aevum_employees = parseInt(ae_split[0])
				if (isNaN(aevum_employees)) {
					ns.print("Invalid Aevum employees: Count is NaN");
					ns.tail();
					return;
				}

				if (ae_split[1] === 'auto') {
					// [x, x, x/2, x, 0, 0]
					aevum_split = [0, 0, 0, 0, 0]
					const x = aevum_employees * 2 / 7;
					let r = 0;

					// x
					r += x;
					aevum_split[0] = Math.trunc(r);
					r -= aevum_split[0];
					// x
					r += x;
					aevum_split[1] = Math.trunc(r);
					r -= aevum_split[1];
					// x/2
					r += x / 2;
					aevum_split[2] = Math.trunc(r);
					r -= aevum_split[2];
					// x
					r += x;
					aevum_split[3] = Math.round(r);
					r = 0;
				} else {
					aevum_split = ae_split[1].split(',').map(s => parseInt(s));
				}

				if (aevum_split.length !== 5 || !aevum_split.every(s => !isNaN(s))) {
					ns.print("Invalid Aevum employees: Invalid split");
					ns.tail();
					return;
				}
				i++;
				break;
			}

			case '-o': {
				if (i+1 > ns.args.length) {
					ns.print("Please provide the other city employees after the -o argument");
					ns.tail();
					return;
				}
				const ot_full = ns.args[i+1] as string;
				if (!ot_full.includes('|')) {
					ns.print("Invalid Other employees: No divider (|)");
					ns.tail();
					return;
				}
				const ot_split = ot_full.split('|');				
				other_employees = parseInt(ot_split[0])
				if (isNaN(other_employees)) {
					ns.print("Invalid Other employees: Count is NaN");
					ns.tail();
					return;
				}

				if (ot_split[1] === 'auto') {
					// [1, 1, 1, 1, x, 0]
					other_split = [1, 1, 1, 1, other_employees - 4];
				} else {
					other_split = ot_split[1].split(',').map(s => parseInt(s));
				}

				if (other_split.length !== 5 || !other_split.every(s => !isNaN(s))) {
					ns.print("Invalid Other employees: Invalid split");
					ns.tail();
					return;
				}
				i++;
				break;
			}
			
			default:
				ns.print("Invalid argument " + ns.args[i]);
				ns.tail();
				break;
		}
	}

	ns.clearLog();
	ns.tail();

	// division
	// const division = "Hippocrat";
	const division = ns.corporation.getCorporation().divisions.find(d => d.type === industry);
	if (!division) {
		ns.print(`No division found for industry: ${industry}`);
		return;
	}

	// hire limit
	for (const city of CITIES) {
		ns.print(city);

		const employees_needed = city === "Aevum" ? aevum_employees : other_employees;
		const job_split = city === "Aevum" ? aevum_split : other_split;
			
		const office = ns.corporation.getOffice(division.name, city);
		if (office.size < employees_needed) {
			// need to upgrade
			ns.corporation.upgradeOfficeSize(division.name, city, employees_needed - office.size);
		}

		while (ns.corporation.getOffice(division.name, city).employees.length < employees_needed) {
			ns.corporation.hireEmployee(division.name, city);
			await ns.sleep(200);
		}

		if (job_split === null) continue;
		for (let i=0; i<5; i++) {
			ns.corporation.setAutoJobAssignment(division.name, city, JOBS[i], job_split[i]);
		}
	}
}