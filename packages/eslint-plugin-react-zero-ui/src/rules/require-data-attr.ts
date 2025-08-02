import { ESLintUtils, TSESTree as T } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/serbyte/eslint-plugin-react-zero-ui/blob/main/docs/${name}.md`);

// At top of create()
const hookLoc = new Map<string /*setter*/, T.SourceLocation>();

export default createRule({
	name: 'require-data-attr',
	meta: {
		type: 'problem',
		docs: { description: 'Enforce data-* attribute on element using setter.ref' },
		schema: [],
		messages: {
			missingAttr: 'Element using "{{setter}}.ref" should include {{attr}}=initialState to avoid FOUC.',
			missingRef: 'Setter "{{setter}}" from useScopedUI("{{key}}") was never attached via .ref.',
		},
	},
	defaultOptions: [],
	/** core visitor */
	create(ctx) {
		/** setter -> key map */
		const scopedSetters = new Map<string /*var*/, string /*key*/>();
		/** setters we saw attached */
		const seenRef = new Set<string>();

		//------------------------------------------------------------------#
		// 1.  Collect useScopedUI calls                                    #
		//------------------------------------------------------------------#
		return {
			VariableDeclarator(node) {
				const { id, init } = node;
				if (id.type !== 'ArrayPattern' || id.elements.length !== 2 || init?.type !== 'CallExpression') return;

				// handle generic call (TSInstantiationExpression) as well
				const callee =
					init.callee.type === 'Identifier'
						? init.callee
						: init.callee.type === 'TSInstantiationExpression' && init.callee.expression.type === 'Identifier'
							? init.callee.expression
							: null;

				if (!callee || callee.name !== 'useScopedUI') return;

				const [, setter] = id.elements;
				if (!setter || setter.type !== 'Identifier') return;

				const [keyArg] = init.arguments as T.Expression[];
				if (!keyArg || keyArg.type !== 'Literal' || typeof keyArg.value !== 'string') return;

				scopedSetters.set(setter.name, keyArg.value);
				hookLoc.set(setter.name, node.loc!);
			},

			//----------------------------------------------------------------
			// 2.  Check JSX ref attachment & data-* attribute
			//----------------------------------------------------------------
			JSXAttribute(node) {
				// ref={setX.ref}
				if (node.name.name !== 'ref' || node.value?.type !== 'JSXExpressionContainer') return;
				const expr = node.value.expression;

				if (expr.type !== 'MemberExpression' || expr.property.type !== 'Identifier' || expr.property.name !== 'ref' || expr.object.type !== 'Identifier')
					return;

				const setterName = expr.object.name;
				const key = scopedSetters.get(setterName);
				if (!key) return; // not our setter

				seenRef.add(setterName);

				// ensure same opening element has `data-${key}`
				const opening = node.parent as T.JSXOpeningElement;
				const attrName = `data-${key}`;
				const hasAttr = opening.attributes.some((a) => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === attrName);

				if (!hasAttr) {
					ctx.report({ node, messageId: 'missingAttr', data: { setter: setterName, attr: attrName } });
				}
			},

			//----------------------------------------------------------------
			// 3.  Program exit – missing ref at all
			//----------------------------------------------------------------
			'Program:exit'() {
				for (const [setter, key] of scopedSetters) {
					if (!seenRef.has(setter)) {
						ctx.report({ messageId: 'missingRef', loc: hookLoc.get(setter)!, data: { setter, key } });
					}
				}
			},
		};
	},
});
