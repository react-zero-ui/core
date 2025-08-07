import { Sandpack } from '@codesandbox/sandpack-react';

export const CodeSandBox: React.FC = () => {
	return (
		<Sandpack
			template="react"
			options={{ layout: 'preview', externalResources: ['https://cdn.tailwindcss.com'] }}
			files={{
				'/App.js': {
					code: `export default function App() {
      return <h1>Hello Zero-UI!</h1>
    }`,
				},
			}}
		/>
	);
};
