import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
	const start = Date.now();

	// check for arguments
	if (ns.args.length < 10) {
		ns.print("Not enough arguments");
		return;
	}
	const server = ns.args[0] as string;
	const host_server = ns.args[1] as string;
	const id = ns.args[2] as string;
	const port = ns.args[3] as number;

	const hack_threads = ns.args[4] as number;
	const weaken_1_threads = ns.args[5] as number;
	const grow_threads = ns.args[6] as number;
	const weaken_2_threads = ns.args[7] as number;

	const JOB_SPACER = ns.args[8] as number;
	// let weaken_time = parseFloat(ns.args[9]);

	// let hack_level_at_launch = ns.getHackingLevel();
	const hack_time = ns.getHackTime(server);
	const grow_time = ns.getGrowTime(server);
	const weaken_time = ns.getWeakenTime(server);

	const hack_end = weaken_time - JOB_SPACER;
	const weaken_1_end = weaken_time;
	const grow_end = weaken_1_end + JOB_SPACER;
	const weaken_2_end = grow_end + JOB_SPACER;

	const hack_start = hack_end - hack_time;
	const weaken_1_start = weaken_1_end - weaken_time;
	const grow_start = grow_end - grow_time;
	const weaken_2_start = weaken_2_end - weaken_time;

	// ns.disableLog("sleep");
	ns.clearLog();
	ns.print("Script start");

	const hack_script = "/hack/hack_once.js";
	const grow_script = "/hack/grow_once.js";
	const weaken_script = "/hack/weaken_once.js";
	// let LAUNCH_SPACER = JOB_SPACER / 2;

	let hack_PID = null;
	let weaken_1_PID = null;
	let grow_PID = null;
	let weaken_2_PID = null;

	// let skip_sleep = true;	
	let time_passed = null;
	// while (hack_PID === null || weaken_1_PID === null || grow_PID === null || weaken_2_PID === null) {
	// 	if (!skip_sleep) {
	// 		await ns.sleep(LAUNCH_SPACER);
	// 	} else {
	// 		skip_sleep = false;
	// 	}

	// 	time_passed = Date.now() - start;
	// 	let time_left_before_hack_start = hack_end - (ns.getHackTime(server) + time_passed);
	// 	ns.print("time_left_before_hack_start: ", time_left_before_hack_start);
	// 	if (hack_PID === null && time_left_before_hack_start <= LAUNCH_SPACER) {
	// 		if (time_left_before_hack_start > 0) {
	// 			await ns.sleep(time_left_before_hack_start);
	// 			skip_sleep = true;
	// 		}
	// 		hack_PID = ns.exec(hack_script, host_server, hack_threads, server, id, port);
	// 	}

	// 	time_passed = Date.now() - start;
	// 	let time_left_before_weaken_1_start = weaken_1_end - (ns.getWeakenTime(server) + time_passed);
	// 	ns.print("time_left_before_weaken_1_start: ", time_left_before_weaken_1_start);
	// 	if (weaken_1_PID === null && time_left_before_weaken_1_start <= LAUNCH_SPACER) {
	// 		if (time_left_before_weaken_1_start > 0) {
	// 			await ns.sleep(time_left_before_weaken_1_start);
	// 			skip_sleep = true;
	// 		}
	// 		weaken_1_PID = ns.exec(weaken_script, host_server, weaken_1_threads, server, id + "_1", port);
	// 	}

	// 	time_passed = Date.now() - start;
	// 	let time_left_before_grow_start = grow_end - (ns.getGrowTime(server) + time_passed);
	// 	ns.print("time_left_before_grow_start: ", time_left_before_grow_start);
	// 	if (grow_PID === null && time_left_before_grow_start <= LAUNCH_SPACER) {
	// 		if (time_left_before_grow_start > 0) {
	// 			await ns.sleep(time_left_before_grow_start);
	// 			skip_sleep = true;
	// 		}
	// 		grow_PID = ns.exec(grow_script, host_server, grow_threads, server, id, port);
	// 	}

	// 	time_passed = Date.now() - start;
	// 	let time_left_before_weaken_2_start = weaken_2_end - (ns.getWeakenTime(server) + time_passed);
	// 	ns.print("time_left_before_weaken_2_start: ", time_left_before_weaken_2_start);
	// 	if (weaken_2_PID === null && time_left_before_weaken_2_start <= LAUNCH_SPACER) {
	// 		if (time_left_before_weaken_2_start > 0) {
	// 			await ns.sleep(time_left_before_weaken_2_start);
	// 			skip_sleep = true;
	// 		}
	// 		weaken_2_PID = ns.exec(weaken_script, host_server, weaken_2_threads, server, id + "_2", port);
	// 	}

	// 	ns.print(" ")
	// }

	// the launch order will be W1, W2, G, H
	time_passed = Date.now() - start;
	await ns.sleep(weaken_1_start - time_passed);
	weaken_1_PID = ns.exec(weaken_script, host_server, weaken_1_threads, server, id + "_1", port);
	
	time_passed = Date.now() - start;
	await ns.sleep(weaken_2_start - time_passed);
	weaken_2_PID = ns.exec(weaken_script, host_server, weaken_2_threads, server, id + "_2", port);
	
	time_passed = Date.now() - start;
	await ns.sleep(grow_start - time_passed);
	grow_PID = ns.exec(grow_script, host_server, grow_threads, server, id, port);
	
	time_passed = Date.now() - start;
	await ns.sleep(hack_start - time_passed);
	hack_PID = ns.exec(hack_script, host_server, hack_threads, server, id, port);

	// wait until all children finish
	while (ns.isRunning(hack_PID) || ns.isRunning(weaken_1_PID) || ns.isRunning(grow_PID) || ns.isRunning(weaken_2_PID)) {
		await ns.sleep(JOB_SPACER);
	}
}