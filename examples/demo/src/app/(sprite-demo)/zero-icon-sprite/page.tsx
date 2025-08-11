import {
	AlarmSmoke,
	Album,
	AArrowDown,
	AArrowUp,
	Accessibility,
	Activity,
	Airplay,
	AirVent,
	ALargeSmall,
	AlarmClock,
	AlarmClockCheck,
	AlarmClockMinus,
	AlarmClockOff,
	AlarmClockPlus,
	AlignCenter,
	AlignCenterHorizontal,
	AlignCenterVertical,
	AlignEndHorizontal,
	AlignEndVertical,
	AlignHorizontalDistributeCenter,
	AlignHorizontalDistributeEnd,
	AlignHorizontalDistributeStart,
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
	AlignHorizontalSpaceAround,
	AlignHorizontalSpaceBetween,
	AlignJustify,
	AlignLeft,
	AlignRight,
	AlignStartHorizontal,
	AlignStartVertical,
	AlignVerticalDistributeCenter,
	AlignVerticalDistributeEnd,
	AlignVerticalDistributeStart,
	AlignVerticalJustifyCenter,
	AlignVerticalJustifyEnd,
	AlignVerticalJustifyStart,
	AlignVerticalSpaceAround,
	AlignVerticalSpaceBetween,
	Ambulance,
	Ampersand,
	Ampersands,
	Amphora,
	Anchor,
	Angry,
	Annoyed,
	Antenna,
	Anvil,
	Aperture,
	Apple,
	AppWindow,
	AppWindowMac,
	Archive,
	ArchiveRestore,
	ArchiveX,
	Armchair,
	ArrowBigDown,
	ArrowBigDownDash,
	ArrowBigLeft,
	ArrowBigLeftDash,
	ArrowBigRight,
	ArrowBigRightDash,
	ArrowBigUp,
	ArrowBigUpDash,
	ArrowDown,
	ArrowDown01,
	ArrowDown10,
	ArrowDownAZ,
	ArrowDownFromLine,
	ArrowDownLeft,
	ArrowDownNarrowWide,
	ArrowDownRight,
	ArrowDownToDot,
	ArrowDownToLine,
	ArrowDownUp,
	ArrowDownWideNarrow,
	ArrowDownZA,
	ArrowLeft,
	ArrowLeftFromLine,
	ArrowLeftRight,
	ArrowLeftToLine,
	ArrowRight,
	ArrowRightFromLine,
	ArrowRightLeft,
	ArrowRightToLine,
	ArrowsUpFromLine,
	ArrowUp,
	ArrowUp01,
	ArrowUp10,
	ArrowUpAZ,
	ArrowUpDown,
	ArrowUpFromDot,
	ArrowUpFromLine,
	ArrowUpLeft,
	ArrowUpNarrowWide,
	ArrowUpRight,
	ArrowUpToLine,
	ArrowUpWideNarrow,
	ArrowUpZA,
	Asterisk,
	Atom,
	AtSign,
	AudioLines,
	AudioWaveform,
	Award,
	Axe,
	Axis3d,
	Baby,
	Backpack,
	Badge,
	BadgeAlert,
	BadgeCent,
	BadgeCheck,
	BadgeDollarSign,
	BadgeEuro,
	BadgeIndianRupee,
	BadgeInfo,
	BadgeJapaneseYen,
	BadgeMinus,
	BadgePercent,
	BadgePlus,
	BadgePoundSterling,
	BadgeRussianRuble,
	BadgeSwissFranc,
	BadgeX,
	BaggageClaim,
	Ban,
	Banana,
	Bandage,
	Banknote,
	Barcode,
	Baseline,
	Bath,
	Battery,
	BluetoothSearching,
	Facebook,
	Instagram,
	Linkedin,
	InspectionPanel,
} from '@react-zero-ui/icon-sprite';
import Link from 'next/link';

const page = () => {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
			<main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Zero UI Icon Sprite</h1>
						<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
							Lucide to SVG sprite solution for React. w/custom icon support.{' '}
							<Link
								href="https://github.com/react-zero-ui/icon-sprite#readme"
								className="text-blue-500 hover:underline"
								target="_blank">
								See Github
							</Link>
						</p>
					</div>
					<div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 w-fit dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 shadow-sm overflow-hidden">
						<Link
							href="/zero-icon-sprite"
							className="px-3 py-2 text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 w-fit"
							aria-current="page">
							Zero UI Sprite
						</Link>
						<Link
							href="/lucide-react"
							className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 w-fit">
							Lucide React
						</Link>
					</div>
				</div>

				<section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 shadow-sm">
						<div className="text-xs uppercase tracking-wide text-slate-500">This page</div>
						<div className="mt-1 flex items-baseline gap-2">
							<div className="text-xl sm:text-2xl font-semibold">HTML size: 6.9kb</div>
							<span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">-290%</span>
						</div>
					</div>
					<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 shadow-sm">
						<div className="text-xs uppercase tracking-wide text-slate-500">Lucide React page</div>
						<div className="mt-1 flex items-baseline gap-2">
							<div className="text-xl sm:text-2xl font-semibold">HTML size: 19.5kb</div>
							<span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">+290%</span>
						</div>
					</div>
				</section>

				<p className="text-sm text-slate-600 dark:text-slate-300">Open DevTools → Elements to compare document size and structure.</p>

				<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 shadow-sm">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">150 Icons</h2>
						<div className="text-xs text-slate-500">Sprite-based rendering</div>
					</div>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3 **:rounded-md **:bg-blue-600 **:text-white **:p-2 **:shadow-sm **:transition **:duration-150 **:hover:scale-105 **:w-9 **:h-9 justify-items-center">
						<AlarmSmoke size={24} />
						<Album size={24} />
						<AArrowDown size={24} />
						<AArrowUp size={24} />
						<Accessibility size={24} />
						<Activity size={24} />
						<Airplay size={24} />
						<AirVent size={24} />
						<ALargeSmall size={24} />
						<AlarmClock size={24} />
						<AlarmClockCheck size={24} />
						<AlarmClockMinus size={24} />
						<AlarmClockOff size={24} />
						<AlarmClockPlus size={24} />
						<AlignCenter size={24} />
						<AlignCenterHorizontal size={24} />
						<AlignCenterVertical size={24} />
						<AlignEndHorizontal size={24} />
						<AlignEndVertical size={24} />
						<AlignHorizontalDistributeCenter size={24} />
						<AlignHorizontalDistributeEnd size={24} />
						<AlignHorizontalDistributeStart size={24} />
						<AlignHorizontalJustifyCenter size={24} />
						<AlignHorizontalJustifyEnd size={24} />
						<AlignHorizontalJustifyStart size={24} />
						<AlignHorizontalSpaceAround size={24} />
						<AlignHorizontalSpaceBetween size={24} />
						<AlignJustify size={24} />
						<AlignLeft size={24} />
						<AlignRight size={24} />
						<AlignStartHorizontal size={24} />
						<AlignStartVertical size={24} />
						<AlignVerticalDistributeCenter size={24} />
						<AlignVerticalDistributeEnd size={24} />
						<AlignVerticalDistributeStart size={24} />
						<AlignVerticalJustifyCenter size={24} />
						<AlignVerticalJustifyEnd size={24} />
						<AlignVerticalJustifyStart size={24} />
						<AlignVerticalSpaceAround size={24} />
						<AlignVerticalSpaceBetween size={24} />
						<Ambulance size={24} />
						<Ampersand size={24} />
						<Ampersands size={24} />
						<Amphora size={24} />
						<Anchor size={24} />
						<Angry size={24} />
						<Annoyed size={24} />
						<Antenna size={24} />
						<Anvil size={24} />
						<Aperture size={24} />
						<Apple size={24} />
						<AppWindow size={24} />
						<AppWindowMac size={24} />
						<Archive size={24} />
						<ArchiveRestore size={24} />
						<ArchiveX size={24} />
						<Armchair size={24} />
						<ArrowBigDown size={24} />
						<ArrowBigDownDash size={24} />
						<ArrowBigLeft size={24} />
						<ArrowBigLeftDash size={24} />
						<ArrowBigRight size={24} />
						<ArrowBigRightDash size={24} />
						<ArrowBigUp size={24} />
						<ArrowBigUpDash size={24} />
						<ArrowDown size={24} />
						<ArrowDown01 size={24} />
						<ArrowDown10 size={24} />
						<ArrowDownAZ size={24} />
						<ArrowDownFromLine size={24} />
						<ArrowDownLeft size={24} />
						<ArrowDownNarrowWide size={24} />
						<ArrowDownRight size={24} />
						<ArrowDownToDot size={24} />
						<ArrowDownToLine size={24} />
						<ArrowDownUp size={24} />
						<ArrowDownWideNarrow size={24} />
						<ArrowDownZA size={24} />
						<ArrowLeft size={24} />
						<ArrowLeftFromLine size={24} />
						<ArrowLeftRight size={24} />
						<ArrowLeftToLine size={24} />
						<ArrowRight size={24} />
						<ArrowRightFromLine size={24} />
						<ArrowRightLeft size={24} />
						<ArrowRightToLine size={24} />
						<ArrowsUpFromLine size={24} />
						<ArrowUp size={24} />
						<ArrowUp01 size={24} />
						<ArrowUp10 size={24} />
						<ArrowUpAZ size={24} />
						<ArrowUpDown size={24} />
						<ArrowUpFromDot size={24} />
						<ArrowUpFromLine size={24} />
						<ArrowUpLeft size={24} />
						<ArrowUpNarrowWide size={24} />
						<ArrowUpRight size={24} />
						<ArrowUpToLine size={24} />
						<ArrowUpWideNarrow size={24} />
						<ArrowUpZA size={24} />
						<Asterisk size={24} />
						<Atom size={24} />
						<AtSign size={24} />
						<AudioLines size={24} />
						<AudioWaveform size={24} />
						<Award size={24} />
						<Axe size={24} />
						<Axis3d size={24} />
						<Baby size={24} />
						<Backpack size={24} />
						<Badge size={24} />
						<BadgeAlert size={24} />
						<BadgeCent size={24} />
						<BadgeCheck size={24} />
						<BadgeDollarSign size={24} />
						<BadgeEuro size={24} />
						<BadgeIndianRupee size={24} />
						<BadgeInfo size={24} />
						<BadgeJapaneseYen size={24} />
						<BadgeMinus size={24} />
						<BadgePercent size={24} />
						<BadgePlus size={24} />
						<BadgePoundSterling size={24} />
						<BadgeRussianRuble size={24} />
						<BadgeSwissFranc size={24} />
						<BadgeX size={24} />
						<BaggageClaim size={24} />
						<Ban size={24} />
						<Banana size={24} />
						<Bandage size={24} />
						<Banknote size={24} />
						<Barcode size={24} />
						<Baseline size={24} />
						<Bath size={24} />
						<Battery size={24} />
						<BluetoothSearching size={24} />
						<Facebook size={24} />
						<Instagram size={24} />
						<Linkedin size={24} />
						<InspectionPanel size={24} />
					</div>
				</div>
			</main>
		</div>
	);
};

export default page;
