import { CITIES, JOBS } from "corp/constants"

/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog();
	ns.tail();

	const aevum_split = {
		[JOBS[0]]: 20,
		[JOBS[1]]: 20,
		[JOBS[2]]: 4,
		[JOBS[3]]: 4,
		[JOBS[4]]: 12,
		[JOBS[5]]: 0,
	}
	const normal_split = {
		[JOBS[0]]: 7,
		[JOBS[1]]: 7,
		[JOBS[2]]: 2,
		[JOBS[3]]: 7,
		[JOBS[4]]: 7,
		[JOBS[5]]: 0,
	}

	// division
	// const division = "Hippocrat";
	const divisions = ns.corporation.getCorporation().divisions.map((div) => div.name);
	// hire limit
	const aevum_employees = 60;
	const employees = 30;

	for (const city of CITIES) {
		ns.print(city);

		const employees_needed = city === "Aevum" ? aevum_employees : employees;
		const job_split = city === "Aevum" ? aevum_split : normal_split;

		for (const division of divisions) {
			ns.print(division);
			
			const office = ns.corporation.getOffice(division, city);
			if (office.size < employees_needed) {
				// need to upgrade
				ns.corporation.upgradeOfficeSize(division, city, employees_needed - office.size);
			}

			while (ns.corporation.getOffice(division, city).employees.length < employees_needed) {
				ns.corporation.hireEmployee(division, city);
				await ns.sleep(500);
			}

			for (const job of JOBS) {
				ns.corporation.setAutoJobAssignment(division, city, job, job_split[job]);
			}
		}
	}
}