interface Props extends React.SVGProps<SVGSVGElement> {
	name: string;
}

export const Icon: React.FC<Props> = ({ name, ...rest }) => {
	return (
		<svg {...rest}>
			<use xlinkHref={`/icons-old.svg#${name}`} />
		</svg>
	);
};
