export const SectionGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<section className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-15 gap-2 md:gap-3 *:rounded-md *:bg-blue-600 *:text-white *:p-2 *:shadow-md *:transition *:duration-150 *:w-9 *:h-9 justify-items-center *:hover:shadow-none *:hover:translate-y-[1px]">
			{children}
		</section>
	);
};
