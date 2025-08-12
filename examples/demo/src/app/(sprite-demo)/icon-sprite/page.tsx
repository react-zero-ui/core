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
	GitMerge,
	GitPullRequest,
	GitBranch,
	PencilRuler,
	GitGraph,
	PencilLine,
	Pen,
	Pencil,
	Pin,
	GitCommitVertical,
} from '@react-zero-ui/icon-sprite';
import Link from 'next/link';
import HeaderBar from '../components/HeaderBar';
import StatsCard from '../components/StatsCard';
import { SectionGrid } from '../components/SectionGrid';

export const metadata = {
	title: 'Zero UI Icon Sprite - The fastest way to do icons in React',
	description: 'Lucide to SVG sprite for React. w/custom icon support.',
	alternates: { canonical: 'https://zero-ui.dev/icon-sprite' },
};

const page = () => {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
			<main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
				<HeaderBar
					title="Zero UI Icon Sprite"
					subtitle={
						<>
							Lucide to SVG sprite solution for React. w/custom icon support.{' '}
							<Link
								href="https://github.com/react-zero-ui/icon-sprite#readme"
								className="text-blue-500 hover:underline"
								target="_blank">
								See Github
							</Link>
						</>
					}
					activeTab="sprite"
				/>

				<section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<StatsCard
						title="This page"
						value="7.5kb"
						badgeText="-260%"
						badgeTone="positive"
					/>
					<StatsCard
						title="Lucide React page"
						value="19.5kb"
						badgeText="+260%"
						badgeTone="negative"
					/>
				</section>

				<p className="text-sm text-slate-600 dark:text-slate-300">Open DevTools → Elements to compare document size and structure.</p>

				<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60  p-4 shadow-sm">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">150 Icons - loaded with Zero Icon Sprite</h2>
						<div className="text-xs text-slate-500">Sprite-based rendering</div>
					</div>
					<SectionGrid>
						<Facebook size={24} />
						<Instagram
							height={24}
							width={24}
						/>
						<Linkedin size={24} />
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
						<GitCommitVertical size={24} />
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
					</SectionGrid>
				</div>
			</main>
		</div>
	);
};

export default page;
