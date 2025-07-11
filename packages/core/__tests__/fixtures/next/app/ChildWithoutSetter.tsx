export function ChildComponent() {
	return (
		<div
			className="child-closed:bg-gray-100 child-open:bg-gray-900 child-open:text-white"
			data-testid="child-container">
			<div
				className="border-2 border-blue-500"
				data-testid="child-toggle">
				No Setter Child
			</div>
			<div className="child-closed:bg-gray-100 child-open:bg-gray-900 flex">
				Child: <span className="child-open:block child-closed:hidden">Open</span> <span className="child-closed:block child-open:hidden">Closed</span>
			</div>
		</div>
	);
}
