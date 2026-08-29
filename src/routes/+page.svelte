<script lang="ts">
	import { Receipt, Wrench, ChevronDown, ArrowUpRight, Activity, TrendingUp } from '@lucide/svelte';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { AssetActivity, Expense } from '$lib/types';
	import { SvelteMap, SvelteDate } from 'svelte/reactivity';

	interface PageData {
		expenses: Expense[];
		activities: AssetActivity[];
	}

	let { data }: { data: PageData } = $props();

	let expensesList = $derived(data.expenses || []);
	let activitiesList = $derived(data.activities || []);

	function toISODateString(d: Date | string | number): string {
		const dateObj = new SvelteDate(d);
		if (isNaN(dateObj.getTime())) return '';
		return dateObj.toISOString().split('T')[0];
	}

	// 1. Group expenses and activities by Date string (YYYY-MM-DD)
	let activityMap = $derived.by(() => {
		const map = new SvelteMap<
			string,
			{
				count: number;
				spendCents: number;
				items: Array<{ vendor: string; category: string; amountCents: number }>;
			}
		>();

		// Map Expenses
		for (const exp of expensesList) {
			const dateKey = toISODateString(exp.createdAt || exp.date);
			if (!dateKey) continue;

			const current = map.get(dateKey) || { count: 0, spendCents: 0, items: [] };
			current.count += 1;
			current.spendCents += exp.amountCents;
			current.items.push({
				vendor: exp.vendor,
				category: exp.category,
				amountCents: exp.amountCents
			});
			map.set(dateKey, current);
		}

		// Map Asset Activities
		for (const act of activitiesList) {
			const dateKey = toISODateString(act.createdAt || act.date);
			if (!dateKey) continue;

			const current = map.get(dateKey) || { count: 0, spendCents: 0, items: [] };
			current.count += 1;
			current.spendCents += act.costCents;
			current.items.push({
				vendor: act.vendor || act.title,
				category: act.category,
				amountCents: act.costCents
			});
			map.set(dateKey, current);
		}

		return map;
	});

	function getOrdinalSuffix(day: number): string {
		if (day > 3 && day < 21) return 'th';
		switch (day % 10) {
			case 1:
				return 'st';
			case 2:
				return 'nd';
			case 3:
				return 'rd';
			default:
				return 'th';
		}
	}

	function formatContributionDate(dateObj: Date): string {
		const month = dateObj.toLocaleDateString('en-US', { month: 'long' });
		const day = dateObj.getDate();
		return `${month} ${day}${getOrdinalSuffix(day)}`;
	}

	let hoveredDayTooltip = $state<{
		text: string;
		x: number;
		y: number;
	} | null>(null);

	// 2. Generate 53-week (365 days) GitHub-style contribution graph leading up to today
	let contributionHeatmap = $derived.by(() => {
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);

		const endDayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
		const numWeeks = 53;
		const startDate = new SvelteDate(today);
		// Align to Sunday of 52 weeks ago
		startDate.setDate(today.getDate() - (numWeeks - 1) * 7 - endDayOfWeek);

		const weeks: Array<{
			monthLabel?: string;
			days: Array<{
				dateObj: Date;
				dateStr: string;
				formattedDate: string;
				count: number;
				spendCents: number;
				intensity: 0 | 1 | 2 | 3 | 4;
				isFuture: boolean;
			}>;
		}> = [];

		let cursor = new SvelteDate(startDate);
		let lastMonth = -1;
		let totalYearContributions = 0;

		for (let w = 0; w < numWeeks; w++) {
			const days = [];
			let weekMonthLabel: string | undefined = undefined;

			for (let d = 0; d < 7; d++) {
				const dateObj = new SvelteDate(cursor);
				const dateStr = toISODateString(dateObj);
				const isFuture = dateObj.getTime() > today.getTime();

				const activityData = activityMap.get(dateStr) || { count: 0, spendCents: 0, items: [] };
				const count = isFuture ? 0 : activityData.count;

				let intensity: 0 | 1 | 2 | 3 | 4 = 0;
				if (count >= 5) intensity = 4;
				else if (count >= 3) intensity = 3;
				else if (count >= 2) intensity = 2;
				else if (count >= 1) intensity = 1;

				if (!isFuture) {
					totalYearContributions += count;
				}

				// Place month label if month changed on first row of week
				if (d === 0) {
					const m = dateObj.getMonth();
					if (m !== lastMonth) {
						weekMonthLabel = dateObj.toLocaleDateString('en-US', { month: 'short' });
						lastMonth = m;
					}
				}

				days.push({
					dateObj,
					dateStr,
					formattedDate: formatContributionDate(dateObj),
					count,
					spendCents: activityData.spendCents,
					intensity,
					isFuture
				});

				cursor.setDate(cursor.getDate() + 1);
			}

			weeks.push({
				monthLabel: weekMonthLabel,
				days
			});
		}

		return {
			weeks,
			totalYearContributions
		};
	});

	// Heatmap Summary Metrics
	let totalActiveDays = $derived(
		contributionHeatmap.weeks.reduce(
			(sum, w) => sum + w.days.filter((d) => !d.isFuture && d.count > 0).length,
			0
		)
	);

	let totalLoggedItems = $derived(expensesList.length + activitiesList.length);

	let totalHeatmapOutlayCents = $derived(
		contributionHeatmap.weeks.reduce(
			(sum, w) => sum + w.days.reduce((dSum, d) => dSum + (d.isFuture ? 0 : d.spendCents), 0),
			0
		)
	);

	// Combined recent activities stream
	let recentActivitiesFeed = $derived.by(() => {
		const feed: Array<{
			id: string;
			type: 'expense' | 'maintenance';
			vendor: string;
			category: string;
			date: Date | string | number;
			amountCents: number;
			notes?: string | null;
		}> = [];

		for (const exp of expensesList) {
			feed.push({
				id: exp.id,
				type: 'expense',
				vendor: exp.vendor,
				category: exp.category,
				date: exp.date,
				amountCents: exp.amountCents,
				notes: exp.notes
			});
		}

		for (const act of activitiesList) {
			feed.push({
				id: act.id,
				type: 'maintenance',
				vendor: act.vendor || act.title,
				category: act.category,
				date: act.date,
				amountCents: act.costCents,
				notes: act.notes
			});
		}

		return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
	});

	// Today's Spending calculation
	let todaySpendCents = $derived.by(() => {
		const todayStr = toISODateString(new Date());
		let sum = 0;
		for (const exp of expensesList) {
			if (toISODateString(exp.createdAt || exp.date) === todayStr) {
				sum += exp.amountCents;
			}
		}
		for (const act of activitiesList) {
			if (toISODateString(act.createdAt || act.date) === todayStr) {
				sum += act.costCents;
			}
		}
		return sum;
	});

	// Monthly Expenses calculation (accumulates total spend this month across all categories)
	let thisMonthSpendCents = $derived.by(() => {
		const now = new Date();
		const curYear = now.getFullYear();
		const curMonth = now.getMonth();
		let sum = 0;
		for (const exp of expensesList) {
			const d = new Date(exp.date);
			if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
				sum += exp.amountCents;
			}
		}
		for (const act of activitiesList) {
			const d = new Date(act.date);
			if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
				sum += act.costCents;
			}
		}
		return sum;
	});
</script>

<div class="space-y-6">
	<!-- Overview Header -->
	<div class="pb-2">
		<h1 class="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
			Household Overview
		</h1>
	</div>

	<!-- METRIC SUMMARY CARDS GRID (3-Column Layout) -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<!-- Active Days Card -->
		<div
			class="flex flex-col justify-between rounded-2xl border border-[#262836] bg-[#14151b] p-5 transition-colors hover:border-purple-500/40"
		>
			<div class="flex items-center justify-between">
				<span
					class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase"
				>
					<Activity size={15} class="text-purple-400" />
					<span>Active Upload Days</span>
				</span>
				<span
					class="flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1d26] text-xs font-bold text-purple-400"
				>
					{totalActiveDays}
				</span>
			</div>
			<div class="mt-4 flex items-baseline gap-2">
				<h2 class="font-mono text-3xl font-extrabold text-white">{totalActiveDays} Days</h2>
			</div>
			<p class="mt-1 text-xs text-slate-400">Days with logged receipts or activities</p>
		</div>

		<!-- Today's Spending Card -->
		<div
			class="flex flex-col justify-between rounded-2xl border border-[#262836] bg-[#14151b] p-5 transition-colors hover:border-purple-500/40"
		>
			<div class="flex items-center justify-between">
				<span
					class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase"
				>
					<Receipt size={15} class="text-emerald-400" />
					<span>Today's Spending</span>
				</span>
			</div>
			<div class="mt-4 flex items-baseline gap-2">
				<h2 class="font-mono text-3xl font-extrabold text-emerald-400">
					{formatCurrency(todaySpendCents)}
				</h2>
			</div>
			<p class="mt-1 text-xs text-slate-400">Recorded spend for today</p>
		</div>

		<!-- Monthly Expenses Card -->
		<div
			class="flex flex-col justify-between rounded-2xl border border-[#262836] bg-[#14151b] p-5 transition-colors hover:border-purple-500/40"
		>
			<div class="flex items-center justify-between">
				<span
					class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase"
				>
					<TrendingUp size={15} class="text-purple-400" />
					<span>Monthly Expenses</span>
				</span>
				<a
					href="/expenses"
					class="flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1d26] text-slate-300 hover:bg-[#262836]"
				>
					<ArrowUpRight size={14} />
				</a>
			</div>
			<div class="mt-4 flex items-baseline gap-2">
				<h2 class="font-mono text-2xl font-extrabold text-purple-400">
					{formatCurrency(thisMonthSpendCents)}
				</h2>
			</div>
			<p class="mt-1 text-xs text-slate-400">Total spend across all categories this month</p>
		</div>
	</div>

	<!-- GITHUB-STYLE ACTIVITY HEATMAP -->
	<div class="space-y-2">
		<!-- Top Header: X contributions in the last year -->
		<div class="flex items-center justify-between text-sm">
			<h2 class="text-base font-semibold text-slate-100">
				{contributionHeatmap.totalYearContributions} contributions in the last year
			</h2>
			<div
				class="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
			>
				<span>Contribution settings</span>
				<ChevronDown size={13} />
			</div>
		</div>

		<!-- Heatmap Card Container -->
		<div
			class="sharp-corners relative overflow-x-auto border border-[#30363d] bg-[#0d1117] p-4 shadow-xl"
		>
			<!-- Desktop View (Full Year) & Mobile View (Past 3 Months / 13 Weeks) -->
			<div class="select-none max-w-full overflow-hidden">
				<!-- Desktop Layout (Hidden on Mobile) -->
				<div class="hidden md:block min-w-[720px]">
					<!-- Month Labels Row -->
					<div class="mb-1.5 ml-8 flex font-sans text-[10px] text-slate-400">
						{#each contributionHeatmap.weeks as week, i (i)}
							<div class="mr-[3px] w-[11px] shrink-0 text-left">
								{#if week.monthLabel}
									<span>{week.monthLabel}</span>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Heatmap Grid Row -->
					<div class="flex items-start">
						<div
							class="flex h-[95px] shrink-0 flex-col justify-between pt-[14px] pr-2 font-sans text-[9px] leading-none text-slate-400 select-none"
						>
							<span class="h-[10px]">Mon</span>
							<span class="h-[10px]">Wed</span>
							<span class="h-[10px]">Fri</span>
						</div>

						<div class="flex gap-[3px]">
							{#each contributionHeatmap.weeks as week, i (i)}
								<div class="flex flex-col gap-[3px]">
									{#each week.days as day (day.dateStr)}
										{#if day.isFuture}
											<div class="pointer-events-none h-[11px] w-[11px] opacity-0"></div>
										{:else}
											<button
												type="button"
												tabindex="-1"
												aria-label="{day.count} contributions on {day.formattedDate}"
												onmouseenter={(e) => {
													const target = e.currentTarget as HTMLElement;
													const rect = target.getBoundingClientRect();
													const container = target.closest('.relative');
													if (container) {
														const parentRect = container.getBoundingClientRect();
														const x = rect.left - parentRect.left + rect.width / 2;
														const y = rect.top - parentRect.top;
														const text =
															day.count > 0
																? `${day.count} ${day.count === 1 ? 'contribution' : 'contributions'} on ${day.formattedDate}.`
																: `No contributions on ${day.formattedDate}.`;
														hoveredDayTooltip = { text, x, y };
													}
												}}
												onmouseleave={() => (hoveredDayTooltip = null)}
												class="h-[11px] w-[11px] cursor-pointer rounded-[2px] border transition-colors {day.intensity ===
												4
													? 'border-[#39d353] bg-[#39d353]'
													: day.intensity === 3
														? 'border-[#26a641] bg-[#26a641]'
														: day.intensity === 2
															? 'border-[#006d32] bg-[#006d32]'
															: day.intensity === 1
																? 'border-[#0e4429] bg-[#0e4429]'
																: 'border-[rgba(255,255,255,0.05)] bg-[#161b22] hover:border-slate-500'}"
											></button>
										{/if}
									{/each}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Mobile Layout (Past 3 Months / 13 Weeks - Fits Screen Without Scroll) -->
				<div class="block md:hidden">
					<div class="mb-1.5 ml-6 flex font-sans text-[9px] text-slate-400">
						{#each contributionHeatmap.weeks.slice(-13) as week, i (i)}
							<div class="mr-[2px] w-[18px] shrink-0 text-left">
								{#if week.monthLabel}
									<span>{week.monthLabel}</span>
								{/if}
							</div>
						{/each}
					</div>

					<div class="flex items-start">
						<div
							class="flex h-[130px] shrink-0 flex-col justify-between pt-[10px] pr-1.5 font-sans text-[9px] leading-none text-slate-400 select-none"
						>
							<span>Mon</span>
							<span>Wed</span>
							<span>Fri</span>
						</div>

						<div class="flex justify-between w-full gap-[2px]">
							{#each contributionHeatmap.weeks.slice(-13) as week, i (i)}
								<div class="flex flex-col gap-[3px] flex-1">
									{#each week.days as day (day.dateStr)}
										{#if day.isFuture}
											<div class="pointer-events-none h-[15px] w-full opacity-0"></div>
										{:else}
											<button
												type="button"
												tabindex="-1"
												aria-label="{day.count} contributions on {day.formattedDate}"
												class="h-[15px] w-full cursor-pointer rounded-[2px] border transition-colors {day.intensity ===
												4
													? 'border-[#39d353] bg-[#39d353]'
													: day.intensity === 3
														? 'border-[#26a641] bg-[#26a641]'
														: day.intensity === 2
															? 'border-[#006d32] bg-[#006d32]'
															: day.intensity === 1
																? 'border-[#0e4429] bg-[#0e4429]'
																: 'border-[rgba(255,255,255,0.05)] bg-[#161b22] hover:border-slate-500'}"
											></button>
										{/if}
									{/each}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Heatmap Bottom Footer (Learn how we count contributions ... Less More) -->
				<div
					class="mt-2 flex items-center justify-between border-t border-[#30363d]/40 px-1 pt-3 font-sans text-[11px] text-slate-400"
				>
					<a href="/expenses" class="transition-colors hover:text-slate-200">
						Learn how we count contributions
					</a>

					<div class="flex items-center gap-1.5">
						<span>Less</span>
						<div class="flex items-center gap-[3px]">
							<span
								class="h-[10px] w-[10px] rounded-[2px] border border-[rgba(255,255,255,0.05)] bg-[#161b22]"
							></span>
							<span class="h-[10px] w-[10px] rounded-[2px] bg-[#0e4429]"></span>
							<span class="h-[10px] w-[10px] rounded-[2px] bg-[#006d32]"></span>
							<span class="h-[10px] w-[10px] rounded-[2px] bg-[#26a641]"></span>
							<span class="h-[10px] w-[10px] rounded-[2px] bg-[#39d353]"></span>
						</div>
						<span>More</span>
					</div>
				</div>
			</div>

			<!-- Floating Tooltip Matching Reference Image -->
			{#if hoveredDayTooltip}
				<div
					class="pointer-events-none absolute z-30 mb-2 -translate-x-1/2 -translate-y-full transform"
					style="left: {hoveredDayTooltip.x}px; top: {hoveredDayTooltip.y}px;"
				>
					<div
						class="rounded-md border border-[#444c56] bg-[#24292f] px-2.5 py-1 font-sans text-xs font-medium whitespace-nowrap text-slate-100 shadow-2xl"
					>
						{hoveredDayTooltip.text}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- RECENT EXPENSES & ACTIVITY STREAM -->
	<div class="space-y-4 rounded-2xl border border-[#262836] bg-[#14151b] p-6">
		<div class="flex items-center justify-between border-b border-[#262836] pb-3">
			<div>
				<h2 class="flex items-center gap-2 text-lg font-bold text-white">
					<Receipt size={20} class="text-purple-400" />
					<span>Recent Activity & Expenses Stream</span>
				</h2>
				<p class="mt-0.5 text-xs text-slate-400">
					Real stream of uploaded receipts and maintenance entries that feed the heatmap.
				</p>
			</div>

			<a
				href="/expenses"
				class="flex items-center gap-1 text-xs font-bold text-purple-400 hover:underline"
			>
				<span>View All Expenses ({expensesList.length})</span>
				<ArrowUpRight size={14} />
			</a>
		</div>

		{#if recentActivitiesFeed.length > 0}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				{#each recentActivitiesFeed as item (item.id)}
					<div
						class="flex items-center justify-between gap-3 rounded-xl border border-[#262836] bg-[#1c1d26] p-3.5 transition-colors hover:border-purple-500/40"
					>
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400"
							>
								{#if item.type === 'expense'}
									<Receipt size={20} />
								{:else}
									<Wrench size={20} />
								{/if}
							</div>
							<div>
								<p class="text-sm font-bold text-white">{item.vendor}</p>
								<div class="mt-0.5 flex items-center gap-2">
									<span
										class="py-0.2 rounded-md bg-purple-500/20 px-2 text-[10px] font-bold text-purple-300 uppercase"
									>
										{item.category}
									</span>
									<span class="font-mono text-xs text-slate-400">{formatDate(item.date)}</span>
								</div>
							</div>
						</div>

						<div class="text-right">
							<span class="block font-mono text-sm font-bold text-purple-400">
								{formatCurrency(item.amountCents)}
							</span>
							<span class="text-[10px] text-slate-400 capitalize">{item.type}</span>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="space-y-3 rounded-xl border border-[#262836] bg-[#1c1d26] p-8 text-center">
				<Receipt size={32} class="mx-auto text-slate-500" />
				<p class="font-bold text-white">No expenses uploaded yet</p>
				<p class="mx-auto max-w-sm text-xs text-slate-400">
					Click below to upload your first receipt. Every uploaded receipt will automatically
					populate your activity heatmap!
				</p>
				<a
					href="/expenses?action=scan"
					class="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500"
				>
					<Receipt size={14} />
					<span>Upload / Scan Receipt</span>
				</a>
			</div>
		{/if}
	</div>
</div>
