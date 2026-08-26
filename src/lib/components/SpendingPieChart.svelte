<script lang="ts">
	import { ChevronDown, PieChart as PieIcon, LayoutGrid, Tag } from '@lucide/svelte';
	import { formatCurrency } from '$lib/utils';

	export interface SpendingCategoryItem {
		slug: string;
		name: string;
		totalCents: number;
		percentage: number;
		exactPercentage: number;
		color: string;
	}

	interface Props {
		categoryBreakdown: SpendingCategoryItem[];
		totalSpendCents: number;
		currency?: string;
		timeFilter?: 'current_month' | 'all' | 'last_30';
		onTimeFilterChange?: (filter: 'current_month' | 'all' | 'last_30') => void;
		selectedCategory?: string;
		onSelectCategory?: (slug: string) => void;
	}

	let {
		categoryBreakdown = [],
		totalSpendCents = 0,
		currency = 'ZAR',
		timeFilter = 'all',
		onTimeFilterChange,
		selectedCategory = 'all',
		onSelectCategory
	}: Props = $props();

	// Chart view mode: 'combined' (all in 1 master chart) or 'individual' (mini gauge per category)
	let chartViewMode = $state<'combined' | 'individual'>('combined');
	let hoveredSlug = $state<string | null>(null);

	function formatAmount(cents: number): string {
		if (currency === '$' || currency === 'USD') {
			const dollars = Math.round(cents / 100);
			return `$${dollars.toLocaleString('en-US')}`;
		}
		return formatCurrency(cents, currency);
	}

	// Geometry for master combined donut (280 x 280)
	const CX = 140;
	const CY = 140;
	const RADIUS = 88;
	const STROKE_WIDTH = 28;

	// Compute clean sharp flat-end arc slices for combined chart
	let computedSlices = $derived.by(() => {
		if (!categoryBreakdown || categoryBreakdown.length === 0) return [];

		let cumPercent = 0;
		const slices = [];

		for (let i = 0; i < categoryBreakdown.length; i++) {
			const item = categoryBreakdown[i];
			const p = item.exactPercentage / 100;
			if (p <= 0) continue;

			const startAngleDeg = -90 + cumPercent * 360;
			const endAngleDeg = startAngleDeg + p * 360;
			const spanDeg = p * 360;

			// Clean, sharp flat gaps between slices (zero rounded border-radius)
			const gapDeg = categoryBreakdown.length > 1 ? Math.min(2.0, spanDeg * 0.1) : 0;
			const arcStartDeg = startAngleDeg + gapDeg / 2;
			const arcEndDeg = Math.max(arcStartDeg + 0.1, endAngleDeg - gapDeg / 2);

			const radStart = (arcStartDeg * Math.PI) / 180;
			const radEnd = (arcEndDeg * Math.PI) / 180;

			const x1 = CX + RADIUS * Math.cos(radStart);
			const y1 = CY + RADIUS * Math.sin(radStart);
			const x2 = CX + RADIUS * Math.cos(radEnd);
			const y2 = CY + RADIUS * Math.sin(radEnd);

			const largeArcFlag = arcEndDeg - arcStartDeg > 180 ? 1 : 0;
			const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

			// Mid angle for tooltip
			const midAngleDeg = (startAngleDeg + endAngleDeg) / 2;
			const radMid = (midAngleDeg * Math.PI) / 180;
			const tooltipRadius = RADIUS + 32;
			const tooltipX = CX + tooltipRadius * Math.cos(radMid);
			const tooltipY = CY + tooltipRadius * Math.sin(radMid);

			slices.push({
				item,
				d,
				startAngleDeg,
				endAngleDeg,
				midAngleDeg,
				tooltipX,
				tooltipY
			});

			cumPercent += p;
		}

		return slices;
	});

	// Active slice in combined view
	let activeSlice = $derived.by(() => {
		if (hoveredSlug) {
			return computedSlices.find((s) => s.item.slug === hoveredSlug) || null;
		}
		if (selectedCategory && selectedCategory !== 'all') {
			return computedSlices.find((s) => s.item.slug === selectedCategory) || null;
		}
		return null;
	});

	// Helper for mini category gauge charts (120 x 120, Radius 42, Stroke 12)
	function computeMiniArc(percentage: number): { d: string; hasFill: boolean } {
		const miniCX = 60;
		const miniCY = 60;
		const miniRadius = 42;

		if (percentage <= 0) {
			return { d: '', hasFill: false };
		}
		if (percentage >= 99.9) {
			// Near 100% full circle
			const p1 = `M ${miniCX} ${miniCY - miniRadius} A ${miniRadius} ${miniRadius} 0 1 1 ${miniCX - 0.01} ${miniCY - miniRadius}`;
			return { d: p1, hasFill: true };
		}

		const p = Math.min(100, Math.max(0, percentage)) / 100;
		const startAngleDeg = -90;
		const endAngleDeg = startAngleDeg + p * 360;

		const radStart = (startAngleDeg * Math.PI) / 180;
		const radEnd = (endAngleDeg * Math.PI) / 180;

		const x1 = miniCX + miniRadius * Math.cos(radStart);
		const y1 = miniCY + miniRadius * Math.sin(radStart);
		const x2 = miniCX + miniRadius * Math.cos(radEnd);
		const y2 = miniCY + miniRadius * Math.sin(radEnd);

		const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
		const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${miniRadius} ${miniRadius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

		return { d, hasFill: true };
	}
</script>

<!-- Spending Analysis Card -->
<div
	class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
>
	<!-- Card Header & View Switchers -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[var(--color-dark-border)] pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h2 class="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-white">
				<span>Expense Category Analysis</span>
			</h2>
			<p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
				Live breakdown of spending relative to active filters ({categoryBreakdown.length} active categories,
				{formatAmount(totalSpendCents)} total)
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<!-- Mode Toggle: Combined vs Individual -->
			<div
				class="sharp-corners inline-flex border border-[var(--color-dark-border)] bg-[#14151b] p-0.5"
			>
				<button
					type="button"
					onclick={() => (chartViewMode = 'combined')}
					class="sharp-corners flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {chartViewMode ===
					'combined'
						? 'bg-[var(--color-coral)] text-white shadow-md'
						: 'text-[var(--color-text-muted)] hover:bg-[#20222e] hover:text-white'}"
				>
					<PieIcon size={13} />
					<span>Combined</span>
				</button>
				<button
					type="button"
					onclick={() => (chartViewMode = 'individual')}
					class="sharp-corners flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {chartViewMode ===
					'individual'
						? 'bg-[var(--color-coral)] text-white shadow-md'
						: 'text-[var(--color-text-muted)] hover:bg-[#20222e] hover:text-white'}"
				>
					<LayoutGrid size={13} />
					<span>Per Category</span>
				</button>
			</div>

			<!-- Time Scope Quick Selector -->
			<div class="relative inline-block">
				<select
					value={timeFilter}
					onchange={(e) => {
						const val = (e.target as HTMLSelectElement).value as
							'current_month' | 'all' | 'last_30';
						onTimeFilterChange?.(val);
					}}
					class="sharp-corners cursor-pointer appearance-none border border-[var(--color-dark-border)] bg-[#1c1d26] px-3.5 py-1.5 pr-8 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#252733] focus:outline-hidden"
				>
					<option value="current_month">This Month</option>
					<option value="all">All Time</option>
					<option value="last_30">Last 30 Days</option>
				</select>
				<ChevronDown
					size={13}
					class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400"
				/>
			</div>
		</div>
	</div>

	{#if categoryBreakdown.length === 0}
		<!-- Empty Filter State -->
		<div class="space-y-2 py-12 text-center text-[var(--color-text-muted)]">
			<Tag size={32} class="mx-auto text-[var(--color-dark-border)]" />
			<p class="text-sm font-semibold text-slate-300">
				No expenses match the current filter selection
			</p>
			<p class="text-xs text-[var(--color-text-subtle)]">
				Try clearing your filters or selecting a different date range.
			</p>
		</div>
	{:else if chartViewMode === 'combined'}
		<!-- =========================================================================
         VIEW 1: MASTER COMBINED DONUT CHART (Sharp, flat ends, zero border-radius)
         ========================================================================= -->
		<div class="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
			<!-- Donut SVG Canvas (Left) -->
			<div class="relative flex items-center justify-center py-2 md:col-span-6 lg:col-span-7">
				<div class="relative h-64 w-64 sm:h-72 sm:w-72">
					<svg viewBox="0 0 280 280" class="h-full w-full overflow-visible">
						<!-- Background base track circle (subtly visible complete circle) -->
						<circle
							cx={CX}
							cy={CY}
							r={RADIUS}
							fill="none"
							stroke="#242635"
							stroke-width={STROKE_WIDTH}
						/>

						<!-- Clean Flat-End Slices (Zero rounded caps) -->
						{#each computedSlices as slice (slice.item.slug)}
							{@const isHovered = hoveredSlug === slice.item.slug}
							{@const isSelected = selectedCategory === slice.item.slug}
							{@const active = isHovered || isSelected}
							<path
								d={slice.d}
								fill="none"
								stroke={slice.item.color}
								stroke-width={active ? STROKE_WIDTH + 6 : STROKE_WIDTH}
								stroke-linecap="butt"
								class="cursor-pointer transition-all duration-150"
								style="opacity: {hoveredSlug && !active ? 0.35 : 1}; filter: {active
									? `drop-shadow(0 0 6px ${slice.item.color})`
									: 'none'};"
								role="button"
								tabindex="0"
								onmouseenter={() => (hoveredSlug = slice.item.slug)}
								onmouseleave={() => (hoveredSlug = null)}
								onclick={() => onSelectCategory?.(slice.item.slug)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										onSelectCategory?.(slice.item.slug);
									}
								}}
							/>
						{/each}
					</svg>

					<!-- Center Summary Readout -->
					<div
						class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
					>
						<span class="font-mono text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
							{formatAmount(totalSpendCents)}
						</span>
						<span
							class="mt-1 text-[11px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase"
						>
							Total Filtered
						</span>
					</div>

					<!-- Tooltip Callout -->
					{#if activeSlice}
						<div
							class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 transform transition-all duration-150"
							style="left: {((activeSlice.tooltipX / 280) * 100).toFixed(1)}%; top: {(
								(activeSlice.tooltipY / 280) *
								100
							).toFixed(1)}%;"
						>
							<div
								class="sharp-corners flex items-center gap-2 border border-[var(--color-dark-border)] bg-[#14151b] px-3 py-1.5 font-mono text-xs whitespace-nowrap text-white shadow-2xl"
							>
								<span
									class="sharp-corners h-2.5 w-2.5 shrink-0"
									style="background-color: {activeSlice.item.color}"
								></span>
								<span class="font-bold">{activeSlice.item.name}:</span>
								<span class="text-slate-300">{formatAmount(activeSlice.item.totalCents)}</span>
								<span class="font-bold text-[var(--color-coral)]"
									>({activeSlice.item.percentage}%)</span
								>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Category Legend Grid (Right) -->
			<div
				class="flex max-h-80 flex-col justify-center space-y-2 overflow-y-auto pr-1 md:col-span-6 lg:col-span-5"
			>
				{#each categoryBreakdown as item (item.slug)}
					{@const isHovered = hoveredSlug === item.slug}
					{@const isSelected = selectedCategory === item.slug}
					{@const active = isHovered || isSelected}
					<button
						type="button"
						onmouseenter={() => (hoveredSlug = item.slug)}
						onmouseleave={() => (hoveredSlug = null)}
						onclick={() => onSelectCategory?.(item.slug)}
						class="sharp-corners group flex cursor-pointer items-center justify-between border px-3 py-2 text-left transition-all {active
							? 'border-[var(--color-coral)] bg-[#20222f]'
							: 'border-[var(--color-dark-border)] bg-[var(--color-dark-card)] hover:border-[#3c3f54]'}"
					>
						<div class="flex min-w-0 items-center gap-2.5">
							<span class="sharp-corners h-3 w-3 shrink-0" style="background-color: {item.color}"
							></span>
							<span class="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
								{item.name}
							</span>
						</div>

						<div class="flex shrink-0 items-center gap-2 text-right font-mono text-xs">
							<span class="font-bold text-white">{formatAmount(item.totalCents)}</span>
							<span class="w-12 text-right font-semibold text-[var(--color-coral)]"
								>{item.percentage}%</span
							>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<!-- =========================================================================
         VIEW 2: INDIVIDUAL CATEGORY GAUGES (Perspective vs. Total Filtered Spend)
         ========================================================================= -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each categoryBreakdown as item (item.slug)}
				{@const mini = computeMiniArc(item.exactPercentage)}
				{@const isSelected = selectedCategory === item.slug}
				<button
					type="button"
					onclick={() => onSelectCategory?.(item.slug)}
					class="sharp-corners group flex cursor-pointer flex-col justify-between space-y-3 border bg-[var(--color-dark-card)] p-4 text-left transition-all {isSelected
						? 'border-[var(--color-coral)] bg-[#20222f]'
						: 'border-[var(--color-dark-border)] hover:border-[#3d4057]'}"
				>
					<!-- Top Row: Category Name & Ratio -->
					<div class="flex items-center justify-between gap-2">
						<div class="flex min-w-0 items-center gap-2">
							<span class="sharp-corners h-3 w-3 shrink-0" style="background-color: {item.color}"
							></span>
							<span
								class="truncate text-xs font-bold text-white transition-colors group-hover:text-[var(--color-coral)]"
							>
								{item.name}
							</span>
						</div>
						<span
							class="sharp-corners bg-[var(--color-coral-light)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--color-coral)]"
						>
							{item.percentage}%
						</span>
					</div>

					<!-- Middle Row: Mini Sharp Gauge & Value -->
					<div class="flex items-center gap-4">
						<!-- Mini Sharp Gauge SVG (120x120) with clearly visible full circle track -->
						<div class="relative flex h-16 w-16 shrink-0 items-center justify-center">
							<svg viewBox="0 0 120 120" class="h-full w-full overflow-visible">
								<!-- Track circle: Clearly distinguishable from card background for full perspective -->
								<circle cx="60" cy="60" r="42" fill="none" stroke="#303345" stroke-width="12" />
								<!-- Category Share Arc (Sharp butt line-cap) -->
								{#if mini.hasFill}
									<path
										d={mini.d}
										fill="none"
										stroke={item.color}
										stroke-width="12"
										stroke-linecap="butt"
										class="transition-all duration-200"
									/>
								{/if}
							</svg>
							<!-- Center % value -->
							<span
								class="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-slate-200"
							>
								{item.percentage}%
							</span>
						</div>

						<!-- Spending Amounts -->
						<div class="min-w-0">
							<div class="font-mono font-serif text-base font-bold tracking-tight text-white">
								{formatAmount(item.totalCents)}
							</div>
							<div class="mt-0.5 text-[11px] text-[var(--color-text-subtle)]">
								of {formatAmount(totalSpendCents)} total
							</div>
						</div>
					</div>

					<!-- Bottom: Click to filter hint & exact percentage -->
					<div
						class="flex items-center justify-between border-t border-[var(--color-dark-border)]/60 pt-2 text-[10px] text-[var(--color-text-muted)]"
					>
						<span>{isSelected ? '✓ Filter Active' : 'Click to filter'}</span>
						<span class="font-mono font-semibold text-slate-300"
							>{item.exactPercentage.toFixed(1)}%</span
						>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
