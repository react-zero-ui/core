import { type UISetterFn } from '@react-zero-ui/core';

export function ChildComponent({ setIsOpen }: { setIsOpen: UISetterFn }) {
	return (
		<div
			className="child-closed:bg-gray-100 child-open:bg-gray-900 child-open:text-white"
			data-testid="child-container">
			<button
				type="button"
				onClick={() => setIsOpen((prev) => (prev === 'closed' ? 'open' : 'closed'))}
				className="border-2 border-red-500"
				data-testid="child-toggle">
				Toggle Child
			</button>
			<div className="child-closed:bg-gray-100 child-open:bg-gray-900 flex">
				Child: <span className="child-open:block child-closed:hidden">Open</span> <span className="child-closed:block child-open:hidden">Closed</span>
			</div>
		</div>
	);
}
