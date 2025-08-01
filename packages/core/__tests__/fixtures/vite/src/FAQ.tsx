import { useScopedUI } from '@react-zero-ui/core';

function FAQ({ question, answer, index }: { question: string; answer: string; index: number }) {
	const [open, setOpen] = useScopedUI<'open' | 'closed'>('faq', 'closed'); // Same key everywhere!

	return (
		<div
			ref={setOpen.ref}
			data-index={index}
			data-faq={open}>
			<button
				data-testid={`faq-${index}-toggle`}
				className="bg-blue-500 text-white p-2 rounded-md m-5"
				onClick={() => setOpen((prev) => (prev === 'open' ? 'closed' : 'open'))}>
				{question} +
			</button>
			<div
				data-testid={`faq-${index}-answer`}
				className="faq-open:block faq-closed:hidden">
				{answer}
			</div>
		</div>
	);
}

export default FAQ;
