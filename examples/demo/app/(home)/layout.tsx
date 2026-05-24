import { SearchToggle } from "fumadocs-ui/components/layout/search-toggle";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/">) {
	const options = baseOptions();

	return (
		<HomeLayout
			{...options}
			links={[
				{
					type: "custom",
					on: "menu",
					secondary: true,
					children: (
						<SearchToggle
							hideIfDisabled
							className="p-2"
						/>
					),
				},
				...(options.links ?? []),
			]}>
			{children}
		</HomeLayout>
	);
}
