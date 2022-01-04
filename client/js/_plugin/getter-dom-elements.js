export function getDOMElements(elementClasses) {
	let elements = {};
	for (let element in elementClasses) {
		elements[element] = {
			class: DOMElements[element],
			element: document.querySelector('.' + DOMElements[element]),
		};
	}
	return elements;
}
