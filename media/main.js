// @ts-check


// Script run within the webview itself.
(function ()
{
	// @ts-ignore
	const vscode = acquireVsCodeApi();


	var table =  /** @type {HTMLTableElement} */ (document.getElementById("tbb"));


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
				
				obj["key"] = inputs[0].value;
				obj["value"] =   inputs[1].value;
				obj["comment"] =  inputs[2]?.value??"";
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
				
				obj["key"] = inputs[0].value;
				obj["value"] =   inputs[1].value;
				obj["comment"] =  inputs[2]?.value??"";
			}
		}
		vscode.setState({ text: JSON.stringify(obj) });
		vscode.postMessage({
			type: 'delete',
			json: JSON.stringify(obj)
		});
	}
	var add = document.getElementById("addButton");

	if(add){
		add.addEventListener('click', () =>
		{
			// const element = document.createElement('tr');
			// table.appendChild(element);
	
			// const name = document.createElement('td');
			// const __name = document.createElement('input');
			// __name.oninput = inputEvent;
			// name.appendChild(__name);
			// __name.value = '';
			// const value = document.createElement('td');
			// const _value = document.createElement('input');
			// value.appendChild(_value);
			// _value.value = '';
			// _value.oninput = inputEvent;
			// const comment = document.createElement('td');
			// const _comment = document.createElement('input');
			// comment.appendChild(_comment);
			// _comment.value = '';
			// _comment.oninput = inputEvent;
			// const drop = document.createElement('td');
			// drop.innerHTML = '&times;';
			// drop.onclick = () => deleteEvent(element);
			// element.append(name, value, comment, drop);
			// name.focus();
			// element.scrollIntoView();
			var row = table.insertRow();
			var cell0 = row.insertCell(0);
			var cell1 = row.insertCell(1);
			var cell2 = row.insertCell(2);
			var cell3 = row.insertCell(3);
			cell0.innerHTML = '<input type="text" />';
			cell1.innerHTML = '<input type="text" />';
			cell2.innerHTML = '<input type="text" />';
			cell3.innerHTML = `<p align="center">X</p>`;

			cell0.oninput = inputEvent;
			cell1.oninput = inputEvent;
			cell2.oninput = inputEvent;
			cell3.onclick = () => deleteEvent(row);
		});
	}
	
	function updateContent(/** @type {string} */ text)
	{

		let json;
		try
		{
			json = JSON.parse(text);
			console.log("data json is :" +json);
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

		for (const node of json || []){
			var row = table.insertRow();
			var cell0 = row.insertCell(0);
			var cell1 = row.insertCell(1);
			var cell2 = row.insertCell(2);
			var cell3 = row.insertCell(3);

			cell0.innerHTML = `<input type="text" value="${node?._attributes?.name ?? ""}"/>`;
			cell1.innerHTML = `<input type="text" value="${node?.value?._text ?? ""}"/>`;
			cell2.innerHTML = `<input type="text" value="${node?.comment?._text?? ""}"/>`;
			cell3.innerHTML = `<p align="center">X</p>`; //

			cell3.onclick = () => deleteEvent(row);
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
