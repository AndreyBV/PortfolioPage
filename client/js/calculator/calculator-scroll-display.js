export function scrollDisplay(DOMElements) {
	const wrapperExpressionDisplay = DOMElements.displayExpression.html.parentNode;
	const wrapperResultDisplay = DOMElements.displayResult.html.parentNode;

	DOMElements.displayContainer.html.addEventListener('click', event => {
		const wrapperItemDisplay = event.target.parentNode;
		const wrapperExpressionDisplay = wrapperItemDisplay.querySelector(
			'.display-calculator__expression-wrapper'
		);
		const wrapperResultDisplay = wrapperItemDisplay.querySelector('.display-calculator__result-wrapper');

		const stepScroll = 100;
		if (event.target.classList.contains('display-scroll-wrapper__left-button')) {
			scrollItem(wrapperExpressionDisplay, -stepScroll);
			scrollItem(wrapperResultDisplay, -stepScroll);
		} else if (event.target.classList.contains('display-scroll-wrapper__right-button')) {
			scrollItem(wrapperExpressionDisplay, stepScroll);
			scrollItem(wrapperResultDisplay, stepScroll);
		}
		function scrollItem(item, step) {
			if (item !== null) item.scrollLeft += step;
		}
	});

	const resizeItemsDisplayObserver = new ResizeObserver(entries => {
		console.log(entries);
		for (let item of entries) {
			const wrapperItem = item.target.parentNode;
			const marginLeft = parseInt(getComputedStyle(wrapperItem).marginLeft);
			const marginRight = parseInt(getComputedStyle(wrapperItem).marginRight);
			const widthItem = item.target.offsetWidth;
			const widthContainer = wrapperItem.offsetWidth + marginLeft + marginRight;
			const wrapperControl = wrapperItem.parentNode;
			const leftButton = wrapperControl.querySelector('.display-scroll-wrapper__left-button');
			const rightButton = wrapperControl.querySelector('.display-scroll-wrapper__right-button');

			if (widthItem > widthContainer) {
				leftButton.classList.remove('none');
				rightButton.classList.remove('none');
				wrapperItem.scrollLeft = wrapperItem.scrollWidth - widthContainer;
			} else {
				leftButton.classList.add('none');
				rightButton.classList.add('none');
			}
		}
	});

	resizeItemsDisplayObserver.observe(DOMElements.displayExpression.html);
	resizeItemsDisplayObserver.observe(DOMElements.displayResult.html);
}
