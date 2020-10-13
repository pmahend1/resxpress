// @ts-check


// Script run within the webview itself.
(function ()
{
	// @ts-ignore
	const vscode = acquireVsCodeApi();


	var table =  /** @type {HTMLElement} */ (document.querySelector("tbody"));


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
				obj["value"] = inputs[1].value;
				obj["comment"] = inputs[2]?.value ?? "";
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
				obj["value"] = inputs[1].value;
				obj["comment"] = inputs[2]?.value ?? "";
			}
		}
		vscode.setState({ text: JSON.stringify(obj) });
		vscode.postMessage({
			type: 'delete',
			json: JSON.stringify(obj)
		});
	}
	var add = document.getElementById("addButton");

	if (add)
	{
		add.addEventListener('click', () =>
		{
			const tr = document.createElement("tr");

			//create key td
			const key = document.createElement("td");
			const keyInput = document.createElement('input');
			keyInput.value = "";
			keyInput.oninput = inputEvent;
			key.appendChild(keyInput);

			//create value td
			const value = document.createElement("td");
			const valueInput = document.createElement('input');
			valueInput.value =  ""
			valueInput.oninput = inputEvent;
			value.appendChild(keyInput);

			//create comment td
			const comment = document.createElement("td");
			const commentInput = document.createElement('input');
			commentInput.value =  "";
			commentInput.oninput = inputEvent;
			comment.appendChild(keyInput);

			//delete character X
			const x = document.createElement("p");
			x.setAttribute("style","align:center");
			x.onclick = () => deleteEvent(tr);
			// add key value comment tds to tr
			tr.append(key, value, comment, x);

			//add tr to table 
			table.appendChild(tr)
		});
	}

	function updateContent(/** @type {string} */ text)
	{

		let json;
		try
		{
			json = JSON.parse(text);
			console.log("data json is :" + text);
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

		for (const node of json || [])
		{
			//create tr
			const tr = document.createElement("tr");

			//create key td
			const key = document.createElement("td");
			const keyInput = document.createElement('input');
			keyInput.value = node?._attributes?.name ?? "";
			keyInput.oninput = inputEvent;
			key.appendChild(keyInput);

			//create value td
			const value = document.createElement("td");
			const valueInput = document.createElement('input');
			valueInput.value = node?.value?._text ?? ""
			valueInput.oninput = inputEvent;
			value.appendChild(keyInput);

			//create comment td
			const comment = document.createElement("td");
			const commentInput = document.createElement('input');
			commentInput.value = node?.comment?._text ?? "";
			commentInput.oninput = inputEvent;
			comment.appendChild(keyInput);

			//delete character X
			const x = document.createElement("p");
			x.innerHTML = "X";
			x.setAttribute("style","align:center");
			x.onclick = () => deleteEvent(tr);
			// add key value comment tds to tr
			tr.append(key, value, comment, x);

			//add tr to table 
			table.appendChild(tr)

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
