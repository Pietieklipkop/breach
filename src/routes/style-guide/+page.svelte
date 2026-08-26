<script lang="ts">
	import {
		Palette,
		Check,
		AlertTriangle,
		Plus,
		Trash2,
		Search,
		Sparkles,
		X,
		ArrowUpRight,
		Clock,
		UserCheck,
		PieChart
	} from '@lucide/svelte';
	import SpendingPieChart, {
		type SpendingCategoryItem
	} from '$lib/components/SpendingPieChart.svelte';

	let isDemoModalOpen = $state(false);

	// Spending Pie Chart Showcase State (Matches reference image exact categories & amounts)
	let styleGuideCategories = $state<SpendingCategoryItem[]>([
		{
			slug: 'activity',
			name: 'Activity',
			totalCents: 844950,
			percentage: 30,
			exactPercentage: 30,
			color: '#f97316'
		},
		{
			slug: 'meals',
			name: 'Meals',
			totalCents: 675960,
			percentage: 24,
			exactPercentage: 24,
			color: '#10b981'
		},
		{
			slug: 'office-supplies',
			name: 'Office supplies',
			totalCents: 450640,
			percentage: 16,
			exactPercentage: 16,
			color: '#fbbf24'
		},
		{
			slug: 'rewards',
			name: 'Rewards',
			totalCents: 281650,
			percentage: 10,
			exactPercentage: 10,
			color: '#3b82f6'
		},
		{
			slug: 'internet-telephone',
			name: 'Internet&Telephone',
			totalCents: 450640,
			percentage: 16,
			exactPercentage: 16,
			color: '#c084fc'
		},
		{
			slug: 'other',
			name: 'Other',
			totalCents: 112660,
			percentage: 4,
			exactPercentage: 4,
			color: '#374151'
		}
	]);

	let styleGuideTotalCents = $state(2816500); // $28,165
	let styleGuideTimeFilter = $state<'last_30' | 'current_month' | 'all'>('last_30');
	let styleGuideSelectedCategory = $state<string>('all');

	function toggleModal() {
		isDemoModalOpen = !isDemoModalOpen;
	}
</script>

<svelte:head>
	<title>UI Element Style Guide - Insighta AI Theme</title>
</svelte:head>

<div class="max-w-6xl space-y-8 pb-16">
	<!-- Page Header -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[#262836] pb-6 md:flex-row md:items-center"
	>
		<div>
			<div class="mb-2 flex items-center gap-2">
				<span
					class="rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-purple-400 uppercase"
				>
					Insighta AI Design System
				</span>
				<span
					class="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase"
				>
					Live Interactive Guide
				</span>
			</div>
			<h1 class="font-serif text-3xl font-bold tracking-tight text-white md:text-5xl">
				UI Elements & Component Style Guide
			</h1>
			<p class="mt-2 max-w-2xl text-sm text-slate-400">
				Central repository rendering all design tokens, purple glowing metric cards, activity
				heatmaps, gauge meters, and rounded component surfaces.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<button
				onclick={toggleModal}
				class="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all hover:from-purple-500 hover:to-indigo-500"
			>
				<Sparkles size={16} />
				<span>Preview Modal Component</span>
			</button>
		</div>
	</div>

	<!-- Section 1: Color Swatches & Lighting -->
	<section class="space-y-6 rounded-2xl border border-[#262836] bg-[#14151b] p-6">
		<h2 class="flex items-center gap-2 border-b border-[#262836] pb-3 text-xl font-bold text-white">
			<Palette class="text-purple-400" size={20} />
			<span>1. Insighta AI Theme Palette & Tokens</span>
		</h2>

		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
			<div class="space-y-2 rounded-xl border border-[#262836] bg-[#0b0c10] p-3.5">
				<div class="h-10 rounded-lg border border-slate-700 bg-[#0b0c10]"></div>
				<p class="text-xs font-bold text-white">Obsidian BG</p>
				<p class="font-mono text-[10px] text-slate-400">#0b0c10</p>
			</div>

			<div class="space-y-2 rounded-xl border border-[#262836] bg-[#14151b] p-3.5">
				<div class="h-10 rounded-lg border border-slate-700 bg-[#14151b]"></div>
				<p class="text-xs font-bold text-white">Slate Surface</p>
				<p class="font-mono text-[10px] text-slate-400">#14151b</p>
			</div>

			<div class="space-y-2 rounded-xl border border-[#262836] bg-[#1c1d26] p-3.5">
				<div class="h-10 rounded-lg border border-slate-700 bg-[#1c1d26]"></div>
				<p class="text-xs font-bold text-white">Elevated Card</p>
				<p class="font-mono text-[10px] text-slate-400">#1c1d26</p>
			</div>

			<div class="space-y-2 rounded-xl border border-[#262836] bg-[#14151b] p-3.5">
				<div class="h-10 rounded-lg bg-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
				<p class="text-xs font-bold text-white">Electric Purple</p>
				<p class="font-mono text-[10px] text-slate-400">#8b5cf6</p>
			</div>

			<div class="space-y-2 rounded-xl border border-[#262836] bg-[#14151b] p-3.5">
				<div class="h-10 rounded-lg bg-[#22c55e]"></div>
				<p class="text-xs font-bold text-white">Neon Green</p>
				<p class="font-mono text-[10px] text-slate-400">#22c55e</p>
			</div>

			<div class="space-y-2 rounded-xl border border-[#262836] bg-[#14151b] p-3.5">
				<div class="h-10 rounded-lg bg-[#f97316]"></div>
				<p class="text-xs font-bold text-white">Neon Orange</p>
				<p class="font-mono text-[10px] text-slate-400">#f97316</p>
			</div>
		</div>
	</section>

	<!-- Section 2: Stat Metric Cards showcase -->
	<section class="space-y-4">
		<h2 class="border-b border-[#262836] pb-2 text-xl font-bold text-white">
			2. Stat Metric Cards & Glowing Pill Indicators
		</h2>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<!-- Card 1 -->
			<div
				class="flex flex-col justify-between rounded-2xl border border-[#262836] bg-[#14151b] p-5"
			>
				<div class="flex items-center justify-between">
					<span
						class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase"
					>
						<UserCheck size={15} />
						<span>Total Active Users</span>
					</span>
					<button
						type="button"
						class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1c1d26] text-slate-300 hover:bg-[#262836]"
					>
						<ArrowUpRight size={14} />
					</button>
				</div>
				<div class="mt-3 flex items-baseline gap-3">
					<h3 class="font-mono text-3xl font-extrabold text-white">200.9k</h3>
					<span
						class="flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400"
					>
						▲ +6%
					</span>
				</div>
			</div>

			<!-- Card 2 -->
			<div
				class="flex flex-col justify-between rounded-2xl border border-[#262836] bg-[#14151b] p-5"
			>
				<div class="flex items-center justify-between">
					<span
						class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase"
					>
						<Plus size={15} />
						<span>New Users</span>
					</span>
					<button
						type="button"
						class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1c1d26] text-slate-300 hover:bg-[#262836]"
					>
						<ArrowUpRight size={14} />
					</button>
				</div>
				<div class="mt-3 flex items-baseline gap-3">
					<h3 class="font-mono text-3xl font-extrabold text-white">74.2k</h3>
					<span
						class="flex items-center gap-0.5 rounded-full border border-orange-500/30 bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-400"
					>
						▼ -4%
					</span>
				</div>
			</div>

			<!-- Card 3 -->
			<div
				class="flex flex-col justify-between rounded-2xl border border-[#262836] bg-[#14151b] p-5"
			>
				<div class="flex items-center justify-between">
					<span
						class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase"
					>
						<Clock size={15} />
						<span>Engagement Time</span>
					</span>
					<button
						type="button"
						class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1c1d26] text-slate-300 hover:bg-[#262836]"
					>
						<ArrowUpRight size={14} />
					</button>
				</div>
				<div class="mt-3 flex items-baseline gap-3">
					<h3 class="font-mono text-3xl font-extrabold text-white">13.2m</h3>
					<span
						class="flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400"
					>
						▲ +12%
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 3: AI Insights & Heatmap Cards -->
	<section class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
		<!-- Glowing Purple Gradient AI Insights Card -->
		<div
			class="relative flex flex-col justify-between space-y-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 p-6 text-white shadow-[0_0_30px_rgba(139,92,246,0.35)]"
		>
			<div class="flex items-center justify-between">
				<span
					class="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md"
				>
					<Sparkles size={13} />
					<span>Insights</span>
				</span>
			</div>

			<h3 class="text-2xl leading-snug font-bold">
				Improve <span class="underline decoration-white/50">32%</span> in morning engagement showing stronger
				routine adoption across active users.
			</h3>

			<div class="flex items-center gap-1.5 pt-2">
				<span class="h-2 w-8 rounded-full bg-white"></span>
				<span class="h-2 w-2 rounded-full bg-white/40"></span>
				<span class="h-2 w-2 rounded-full bg-white/40"></span>
				<span class="h-2 w-2 rounded-full bg-white/40"></span>
				<span class="h-2 w-2 rounded-full bg-white/40"></span>
			</div>
		</div>

		<!-- User Activity Heatmap Matrix Component -->
		<div class="space-y-4 rounded-2xl border border-[#262836] bg-[#14151b] p-5">
			<div class="flex items-center justify-between border-b border-[#262836] pb-3">
				<h3 class="text-sm font-bold text-white">User Activity Heatmap</h3>
				<div class="flex items-center gap-2 text-[10px] text-slate-400">
					<span class="flex items-center gap-1"
						><span class="h-2 w-2 rounded-xs bg-[#2c2d3d]"></span> &lt;500</span
					>
					<span class="flex items-center gap-1"
						><span class="h-2 w-2 rounded-xs bg-[#6366f1]"></span> &gt;1000</span
					>
					<span class="flex items-center gap-1"
						><span class="h-2 w-2 rounded-xs bg-[#8b5cf6]"></span> &gt;5000</span
					>
				</div>
			</div>

			<!-- Heatmap Grid -->
			<div class="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] text-slate-400">
				{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day (day)}
					<span>{day}</span>
				{/each}

				{#each Array(21).fill(0) as item, i (i)}
					{@const intensity = ((i + (item as number)) * 37) % 3}
					<div
						class="flex h-6 items-center justify-center rounded-md transition-all {intensity === 0
							? 'bg-[#1c1d29] text-slate-600'
							: intensity === 1
								? 'bg-indigo-600/70 text-white'
								: 'bg-purple-600 text-white shadow-[0_0_8px_rgba(139,92,246,0.4)]'}"
					></div>
				{/each}
			</div>
		</div>

		<!-- Quality Score Radial Gauge Component -->
		<div
			class="flex flex-col justify-between space-y-3 rounded-2xl border border-[#262836] bg-[#14151b] p-5"
		>
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-bold text-white">Quality Score Gauge</h3>
				<button
					type="button"
					class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1c1d26] text-slate-300"
				>
					<ArrowUpRight size={14} />
				</button>
			</div>

			<!-- Radial Semi-Circle Blocks -->
			<div class="flex flex-col items-center justify-center py-4">
				<div class="relative flex h-20 w-40 items-end justify-center overflow-hidden">
					<div
						class="h-36 w-36 -rotate-45 transform rounded-full border-[12px] border-purple-600 border-t-purple-500 border-r-purple-600 border-b-transparent border-l-transparent shadow-[0_0_20px_rgba(139,92,246,0.4)]"
					></div>
					<div class="absolute bottom-0 text-center">
						<span class="font-mono text-2xl font-extrabold text-white">64%</span>
						<span class="block text-[10px] text-slate-400">Average Score</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 4: Spending Donut / Pie Chart Component Showcase -->
	<section class="space-y-4">
		<div class="flex items-center justify-between border-b border-[#262836] pb-3">
			<div>
				<h2 class="flex items-center gap-2 text-xl font-bold text-white">
					<PieChart class="text-purple-400" size={20} />
					<span>4. Spending Donut / Pie Chart Component</span>
				</h2>
				<p class="mt-0.5 text-xs text-slate-400">
					Interactive SVG donut chart with segment hover tooltips, category legend, time period
					selector, and AI insight summary.
				</p>
			</div>
			<span
				class="rounded-full border border-purple-500/30 bg-purple-500/20 px-2.5 py-1 text-xs font-bold tracking-wider text-purple-300 uppercase"
			>
				Interactive UI
			</span>
		</div>

		<!-- Live SpendingPieChart Instance -->
		<div class="max-w-2xl">
			<SpendingPieChart
				categoryBreakdown={styleGuideCategories}
				totalSpendCents={styleGuideTotalCents}
				currency="$"
				timeFilter={styleGuideTimeFilter}
				onTimeFilterChange={(f) => (styleGuideTimeFilter = f)}
				selectedCategory={styleGuideSelectedCategory}
				onSelectCategory={(slug) =>
					(styleGuideSelectedCategory = styleGuideSelectedCategory === slug ? 'all' : slug)}
			/>
		</div>
	</section>

	<!-- Section 5: Buttons, Badges & Controls -->
	<section class="space-y-6 rounded-2xl border border-[#262836] bg-[#14151b] p-6">
		<h2 class="border-b border-[#262836] pb-3 text-xl font-bold text-white">
			5. Pill Buttons & Status Badges
		</h2>

		<div class="flex flex-wrap items-center gap-3">
			<button class="btn-primary">
				<Plus size={15} />
				<span>Primary Pill (.btn-primary)</span>
			</button>

			<button class="btn-secondary">
				<Search size={15} />
				<span>Secondary Pill (.btn-secondary)</span>
			</button>

			<button class="btn-outline">
				<Sparkles size={15} />
				<span>Outline (.btn-outline)</span>
			</button>

			<button class="btn-danger">
				<Trash2 size={15} />
				<span>Danger (.btn-danger)</span>
			</button>

			<span class="badge-purple">
				<Sparkles size={12} />
				<span>Purple Badge (.badge-purple)</span>
			</span>

			<span class="badge-success">
				<Check size={12} />
				<span>Success Badge (.badge-success)</span>
			</span>

			<span class="badge-warning">
				<AlertTriangle size={12} />
				<span>Warning Badge (.badge-warning)</span>
			</span>
		</div>
	</section>

	<!-- Section 6: Data Tables -->
	<section class="space-y-4 rounded-2xl border border-[#262836] bg-[#14151b] p-6">
		<h2 class="border-b border-[#262836] pb-3 text-xl font-bold text-white">
			6. Dark Rounded Data Table (.table-sharp)
		</h2>

		<div class="overflow-x-auto">
			<table class="table-sharp">
				<thead>
					<tr>
						<th>Element Name</th>
						<th>Class Target</th>
						<th>Type</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="font-semibold text-white">Electric Purple Pill Button</td>
						<td><code class="text-purple-400">.btn-primary</code></td>
						<td>Interactive Action</td>
						<td><span class="badge-success">Active</span></td>
					</tr>
					<tr>
						<td class="font-semibold text-white">Dark Card Surface</td>
						<td><code class="text-purple-400">.card-surface</code></td>
						<td>Container Box</td>
						<td><span class="badge-success">Active</span></td>
					</tr>
					<tr>
						<td class="font-semibold text-white">Status Indicator Pill</td>
						<td><code class="text-purple-400">.badge-purple</code></td>
						<td>Metadata Badge</td>
						<td><span class="badge-success">Active</span></td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>

<!-- Modal Live Preview -->
{#if isDemoModalOpen}
	<div class="modal-backdrop">
		<div class="modal-container">
			<div class="modal-header">
				<h3 class="flex items-center gap-2 text-lg font-bold text-white">
					<Sparkles class="text-purple-400" size={20} />
					<span>Modal Container Component</span>
				</h3>
				<button onclick={toggleModal} class="btn-icon">
					<X size={18} />
				</button>
			</div>

			<div class="modal-body space-y-4">
				<p class="text-sm text-slate-300">
					This is a live example of the dark rounded modal dialog styled with purple ambient glow.
				</p>

				<div>
					<label
						for="sg-modal-input"
						class="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase"
					>
						Example Input inside Modal
					</label>
					<input id="sg-modal-input" type="text" value="Sample Modal Input" class="form-input" />
				</div>
			</div>

			<div class="modal-footer">
				<button onclick={toggleModal} class="btn-secondary">Close</button>
				<button onclick={toggleModal} class="btn-primary">Confirm Action</button>
			</div>
		</div>
	</div>
{/if}
