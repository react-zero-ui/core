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
	Pin,
	Pencil,
	Pen,
	PencilLine,
	PencilRuler,
	GitGraph,
	GitBranch,
	GitPullRequest,
	GitMerge,
	GitCommit,
} from 'lucide-react';
import HeaderBar from '../components/HeaderBar';
import StatsCard from '../components/StatsCard';
import { SectionGrid } from '../components/SectionGrid';

export const metadata = {
	title: 'Lucide React Icon Demo - Lucide to React solution',
	description: 'See the size difference between Lucide React and Zero UI Icon Sprite. Zero UI Icon Sprite is 300% smaller.',
	alternates: { canonical: 'https://zero-ui.dev/lucide-react' },
};

const page = () => {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
			<main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
				<HeaderBar
					title="Lucide React"
					subtitle="Traditional component-based icons."
					activeTab="lucide"
				/>

				<section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<StatsCard
						title="This page"
						value="19.5kb"
						badgeText="+260%"
						badgeTone="negative"
					/>
					<StatsCard
						title="Zero UI Icon Sprite"
						value="7.5kb"
						badgeText="-260%"
						badgeTone="positive"
					/>
				</section>

				<p className="text-sm text-slate-600 dark:text-slate-300">Open DevTools → Elements to compare document size and structure.</p>

				<div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 shadow-sm">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">150 Icons - loaded with Lucide React</h2>
						<div className="text-xs text-slate-500">Component-based rendering</div>
					</div>
					<SectionGrid>
						<Facebook size={15} />
						<Instagram size={15} />
						<Linkedin size={15} />
						<InspectionPanel size={24} />
						<Pin size={24} />
						<Pencil size={24} />
						<Pen size={24} />
						<PencilLine size={24} />
						<PencilRuler size={24} />
						<GitGraph size={24} />
						<GitBranch size={24} />
						<GitPullRequest size={24} />
						<GitMerge size={24} />
						<GitCommit size={24} />
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
					</SectionGrid>
				</div>
			</main>
		</div>
	);
};

export default page;
