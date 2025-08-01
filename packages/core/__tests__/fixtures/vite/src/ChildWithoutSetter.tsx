export function ChildWithoutSetter() {
	return (
		<div className="border-2 border-blue-500">
			<div
				className="scope-on:bg-blue-900 scope-off:bg-blue-100  scope-on:text-white bg-red-500"
				data-testid="child-scope-container">
				<div className="scope-off:bg-blue-100 scope-on:bg-blue-900  ">
					Child Scope: <span className="scope-off:block scope-on:hidden">False</span>
					<span className="scope-on:block scope-off:hidden">True</span>
				</div>
			</div>
		</div>
	);
}
