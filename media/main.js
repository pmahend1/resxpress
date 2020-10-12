// @ts-check

// Script run within the webview itself.
(function ()
{
	// @ts-ignore
	const vscode = acquireVsCodeApi();


	var table =  /** @type {HTMLElement} */ (document.querySelector(".tbl"));

	const addButtonContainer = document.getElementById('addbutton');
	addButtonContainer.addEventListener('click', () =>
	{
		vscode.postMessage({
			type: 'add'
		});
	})

	const errorContainer = document.createElement('div');
	document.body.appendChild(errorContainer);
	errorContainer.className = 'error'
	errorContainer.style.display = 'none'

	let inputEvent = () =>
	{
		let obj = {};
		let a = table.querySelectorAll('tr');
		for (let rule of a)
		{
			let inputs = rule.querySelectorAll('input');
			if (inputs[0].value && inputs[1].value)
			{
				obj[inputs[0].value] = {
					value: inputs[1].value,
					comment: inputs[2].value
				}
			}
		}
		vscode.setState({ text: JSON.stringify(obj) });
		vscode.postMessage({
			type: 'update',
			json: JSON.stringify(obj)
		});
	};

	let deleteEvent = (self) =>
	{
		self.remove();
		let obj = {};
		let a = table.querySelectorAll('tr');
		for (let rule of a)
		{
			let inputs = rule.querySelectorAll('input');
			if (inputs[0].value && inputs[1].value)
			{
				obj[inputs[0].value] = {
					value: inputs[1].value,
					comment: inputs[2].value
				}
			}
		}
		vscode.setState({ text: JSON.stringify(obj) });
		vscode.postMessage({
			type: 'update',
			json: JSON.stringify(obj)
		});
	}
	document.querySelector(".addButton").addEventListener('click', () =>
	{
		const element = document.createElement('tr');
		table.appendChild(element);

		const name = document.createElement('td');
		const __name = document.createElement('input');
		__name.oninput = inputEvent;
		name.appendChild(__name);
		__name.value = '';
		const value = document.createElement('td');
		const _value = document.createElement('input');
		value.appendChild(_value);
		_value.value = '';
		_value.oninput = inputEvent;
		const comment = document.createElement('td');
		const _comment = document.createElement('input');
		comment.appendChild(_comment);
		_comment.value = '';
		_comment.oninput = inputEvent;
		const drop = document.createElement('td');
		drop.innerHTML = '&times;';
		drop.onclick = () => deleteEvent(element);
		element.append(name, value, comment, drop);
		name.focus();
		element.scrollIntoView();
		// var row = table.insertRow();
		// var cell1 = row.insertCell(0);
		// var cell2 = row.insertCell(1);
		// var cell3 = row.insertCell(2);
		// cell1.innerHTML = '<input type="text" />';
		// cell2.innerHTML = '<input type="text" />';
		// cell3.innerHTML = '<input type="text" />';
	});
	function updateContent(/** @type {string} */ text)
	{

		let json;
		try
		{
			json = JSON.parse(text);
		} catch {
			table.style.display = 'none';
			errorContainer.innerText = 'Error: Document is not valid resx';
			errorContainer.style.display = '';
			return;
		}
		table.style.display = '';
		errorContainer.style.display = 'none';

		// Render the scratches
		table.innerHTML = '';
		for (const _name in json || [])
		{
			let rule = json[_name];
			const element = document.createElement('tr');
			table.appendChild(element);

			const name = document.createElement('td');
			const __name = document.createElement('input');
			__name.oninput = inputEvent;
			name.appendChild(__name);
			__name.value = _name;
			const value = document.createElement('td');
			const _value = document.createElement('input');
			value.appendChild(_value);
			_value.value = rule.value || '';
			_value.oninput = inputEvent;
			const comment = document.createElement('td');
			const _comment = document.createElement('input');
			comment.appendChild(_comment);
			_comment.value = rule.comment || '';
			_comment.oninput = inputEvent;
			const drop = document.createElement('td');
			drop.innerHTML = '&times;';
			drop.onclick = () => deleteEvent(element);
			element.append(name, value, comment, drop);
			table.appendChild(addButtonContainer);
		}
	}
	window.addEventListener('message', event =>
	{
		const message = event.data; // The json data that the extension sent
		switch (message.type)
		{
			case 'update':
				const text = message.text;
				if (text != vscode.getState()?.text)
				{
					// Update our webview's content
					updateContent(text);
				}
				// Update our webview's content
				updateContent(text);

				// Then persist state information.
				// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
				vscode.setState({ text });

				return;
		}
	});
	const state = vscode.getState();
	if (state)
	{
		updateContent(state.text);
	}

}());
