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
} from 'lucide-react';
import Link from 'next/link';

const page = () => {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
			<main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Lucide React</h1>
						<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Traditional component-based icons.</p>
					</div>
					<div className="inline-flex rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 shadow-sm overflow-hidden w-fit">
						<Link
							href="/zero-icon-sprite"
							className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
							Zero UI Sprite
						</Link>
						<Link
							href="/lucide-react"
							className="px-3 py-2 text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900"
							aria-current="page">
							Lucide React
						</Link>
					</div>
				</div>

				<section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 shadow-sm">
						<div className="text-xs uppercase tracking-wide text-slate-500">This page</div>
						<div className="mt-1 flex items-baseline gap-2">
							<div className="text-xl sm:text-2xl font-semibold">HTML size: 19.5kb</div>
							<span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">+290%</span>
						</div>
					</div>
					<div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 shadow-sm">
						<div className="text-xs uppercase tracking-wide text-slate-500">Zero UI Icon Sprite</div>
						<div className="mt-1 flex items-baseline gap-2">
							<div className="text-xl sm:text-2xl font-semibold">HTML size: 6.9kb</div>
							<span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">-290%</span>
						</div>
					</div>
				</section>

				<p className="text-sm text-slate-600 dark:text-slate-300">Open DevTools → Elements to compare document size and structure.</p>

				<div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 shadow-sm">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">150 Icons</h2>
						<div className="text-xs text-slate-500">Component-based rendering</div>
					</div>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3 **:rounded-md **:bg-blue-600 **:text-white **:p-2 **:shadow-sm **:transition **:duration-150 **:hover:scale-105 **:w-9 **:h-9 justify-items-center">
						<AlarmSmoke />
						<Album />
						<AArrowDown />
						<AArrowUp />
						<Accessibility />
						<Activity />
						<Airplay />
						<AirVent />
						<ALargeSmall />
						<AlarmClock />
						<AlarmClockCheck />
						<AlarmClockMinus />
						<AlarmClockOff />
						<AlarmClockPlus />
						<AlignCenter />
						<AlignCenterHorizontal />
						<AlignCenterVertical />
						<AlignEndHorizontal />
						<AlignEndVertical />
						<AlignHorizontalDistributeCenter />
						<AlignHorizontalDistributeEnd />
						<AlignHorizontalDistributeStart />
						<AlignHorizontalJustifyCenter />
						<AlignHorizontalJustifyEnd />
						<AlignHorizontalJustifyStart />
						<AlignHorizontalSpaceAround />
						<AlignHorizontalSpaceBetween />
						<AlignJustify />
						<AlignLeft />
						<AlignRight />
						<AlignStartHorizontal />
						<AlignStartVertical />
						<AlignVerticalDistributeCenter />
						<AlignVerticalDistributeEnd />
						<AlignVerticalDistributeStart />
						<AlignVerticalJustifyCenter />
						<AlignVerticalJustifyEnd />
						<AlignVerticalJustifyStart />
						<AlignVerticalSpaceAround />
						<AlignVerticalSpaceBetween />
						<Ambulance />
						<Ampersand />
						<Ampersands />
						<Amphora />
						<Anchor />
						<Angry />
						<Annoyed />
						<Antenna />
						<Anvil />
						<Aperture />
						<Apple />
						<AppWindow />
						<AppWindowMac />
						<Archive />
						<ArchiveRestore />
						<ArchiveX />
						<Armchair />
						<ArrowBigDown />
						<ArrowBigDownDash />
						<ArrowBigLeft />
						<ArrowBigLeftDash />
						<ArrowBigRight />
						<ArrowBigRightDash />
						<ArrowBigUp />
						<ArrowBigUpDash />
						<ArrowDown />
						<ArrowDown01 />
						<ArrowDown10 />
						<ArrowDownAZ />
						<ArrowDownFromLine />
						<ArrowDownLeft />
						<ArrowDownNarrowWide />
						<ArrowDownRight />
						<ArrowDownToDot />
						<ArrowDownToLine />
						<ArrowDownUp />
						<ArrowDownWideNarrow />
						<ArrowDownZA />
						<ArrowLeft />
						<ArrowLeftFromLine />
						<ArrowLeftRight />
						<ArrowLeftToLine />
						<ArrowRight />
						<ArrowRightFromLine />
						<ArrowRightLeft />
						<ArrowRightToLine />
						<ArrowsUpFromLine />
						<ArrowUp />
						<ArrowUp01 />
						<ArrowUp10 />
						<ArrowUpAZ />
						<ArrowUpDown />
						<ArrowUpFromDot />
						<ArrowUpFromLine />
						<ArrowUpLeft />
						<ArrowUpNarrowWide />
						<ArrowUpRight />
						<ArrowUpToLine />
						<ArrowUpWideNarrow />
						<ArrowUpZA />
						<Asterisk />
						<Atom />
						<AtSign />
						<AudioLines />
						<AudioWaveform />
						<Award />
						<Axe />
						<Axis3d />
						<Baby />
						<Backpack />
						<Badge />
						<BadgeAlert />
						<BadgeCent />
						<BadgeCheck />
						<BadgeDollarSign />
						<BadgeEuro />
						<BadgeIndianRupee />
						<BadgeInfo />
						<BadgeJapaneseYen />
						<BadgeMinus />
						<BadgePercent />
						<BadgePlus />
						<BadgePoundSterling />
						<BadgeRussianRuble />
						<BadgeSwissFranc />
						<BadgeX />
						<BaggageClaim />
						<Ban />
						<Banana />
						<Bandage />
						<Banknote />
						<Barcode />
						<Baseline />
						<Bath />
						<Battery />
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
