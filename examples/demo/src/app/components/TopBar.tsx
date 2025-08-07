import Link from 'next/link';
import { Icon } from './Icon';
import { MobileMenu } from './MobileMenu';
import { MobileMenuButton } from './MobileMenuButton';

const navItems = [
	{ name: 'React Test', href: '/react' },
	{ name: 'Zero UI Test', href: '/zero-ui' },
];

export const TopBarV2: React.FC = () => {
	return (
		<nav className="fixed top-5 left-1/2 z-10 flex w-fit -translate-x-1/2 justify-center text-base md:text-sm">
			{/* Wrapper that grows/shrinks on mobile */}
			<div className="flex flex-col items-center justify-center">
				<div className="overflow-hidden rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-sm">
					<div className="relative flex flex-col">
						{/* Top Row (always visible) */}
						<div className="flex items-center gap-4 px-4 py-3 md:gap-8 md:py-2.5">
							{/* Logo */}
							<Link
								href="/"
								className="flex items-center gap-2 font-medium text-nowrap">
								<Icon
									name="serbyte"
									height={24}
									width={24}
									className="rounded shadow-md"
								/>
								React ZERO UI
							</Link>

							{/* Desktop Navigation */}
							<ul className="desktop-menu-container md:scrolled-down:opacity-0 md:scrolled-down:max-w-0 md:scrolled-up:opacity-100 md:scrolled-up:max-w-96 hidden items-center gap-4 font-medium transition-all duration-300 ease-in-out md:flex">
								{navItems.map((item) => (
									<li
										key={item.name}
										className="flex">
										<Link
											href={item.href}
											className="bubble-hover p-1 px-2">
											{item.name}
										</Link>
									</li>
								))}
								<li className="flex">
									<Link
										href="https://github.com/react-zero-ui/core"
										target="_blank"
										className="bubble-hover hidden w-fit !flex-row items-center gap-2 rounded-full border border-gray-200 px-3 py-1 font-medium shadow-md duration-300 hover:translate-y-0.5 hover:border-white hover:shadow-none md:flex">
										<Icon
											name="github"
											height={24}
											width={24}
											className="text-black"
										/>
										GitHub
									</Link>
								</li>
							</ul>

							{/* Mobile Dots Menu */}
							<MobileMenuButton />
						</div>

						{/* Mobile Menu (renders always but hidden via overflow on wrapper) */}
						<MobileMenu navItems={navItems} />
					</div>
				</div>
				<div className="text-xs text-gray-500">Render-less Zero-UI TopBar</div>
			</div>
		</nav>
	);
};
