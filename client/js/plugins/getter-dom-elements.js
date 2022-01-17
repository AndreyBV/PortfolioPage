export function getDOMElements(elementClasses) {
	let elements = {};
	for (let element in elementClasses) {
		elements[element] = {
			class: elementClasses[element],
			element: document.querySelector('.' + elementClasses[element]),
		};
	}
	return elements;
}
