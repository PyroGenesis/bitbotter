import { CITIES, JOBS } from "corp/constants"

/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog();
	ns.tail();

	// const aevum_split = {
	// 	[JOBS[0]]: 0,
	// 	[JOBS[1]]: 0,
	// 	[JOBS[2]]: 0,
	// 	[JOBS[3]]: 0,
	// 	[JOBS[4]]: 60,
	// }
	// const normal_split = {
	// 	[JOBS[0]]: 0,
	// 	[JOBS[1]]: 0,
	// 	[JOBS[2]]: 0,
	// 	[JOBS[3]]: 0,
	// 	[JOBS[4]]: 30,
	// }

	// division
	// const division = "Hippocrat";
	const divisions = ns.corporation.getCorporation().divisions.map((div) => div.name);
	// hire limit
	// const aevum_employees = 60;
	// const employees = 30;

	for (const city of CITIES) {
		// ns.print(city);

		// const employees_needed = city === "Aevum" ? aevum_employees : employees;
		// const job_split = city === "Aevum" ? aevum_split : normal_split;

		for (const division of divisions) {
			// ns.print(division);
			
			const office = ns.corporation.getOffice(division, city);
			// if (office.size < employees_needed) {
			// 	// need to upgrade
			// 	ns.corporation.upgradeOfficeSize(division, city, employees_needed - office.size);
			// }

			// while (ns.corporation.getOffice(division, city).employees.length < employees_needed) {
			// 	ns.corporation.hireEmployee(division, city);
			// 	await ns.sleep(500);
			// }

			for (const job of JOBS) {
				if (job === "Training") {
					ns.corporation.setAutoJobAssignment(division, city, job, office.employees.length);
				} else {
					ns.corporation.setAutoJobAssignment(division, city, job, 0);
				}				
			}
		}
	}
}