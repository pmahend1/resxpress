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

	function inputEvent()
	{

		let idstr = this.id;
		console.log('input event for id = ' + idstr);
		var index = idstr.split('.')[0];

		console.log('index is :' + index);
		var editingObj = currentResxJS[index];

		const key =  /** @type {HTMLInputElement} */ (document.getElementById(`${index}.key`));
		const value = /** @type {HTMLInputElement} */ (document.getElementById(`${index}.value`));
		const comment =  /** @type {HTMLInputElement} */ (document.getElementById(`${index}.comment`));

		if (key.value && value.value)//
		{
			editingObj._attributes.name = key.value ?? "";
			editingObj.value._text = value.value ?? "";
			editingObj.comment._text = comment.value ?? "";

			currentResxJS[index] = editingObj;

		} else
		{
			alert('Key or Value can not be empty');
			return;
		}


		console.log('Input event : ' + JSON.stringify(currentResxJS));
		vscode.setState({ text: JSON.stringify(currentResxJS) });
		vscode.postMessage({
			type: 'update',
			json: JSON.stringify(currentResxJS)
		});
	};

	function deleteEvent()
	{

		let idstr = this.id;
		console.log('id to be deleted = ' + idstr);
		var index = idstr.split('.')[0];

		var deleteableObj = currentResxJS[index];

		//x=td -> tr -> tbody-> table
		var row = /** @type {HTMLTableElement} */ this.parentNode;//.parentNode.parentNode;
		row.parentNode.removeChild(row);

		vscode.setState({ text: JSON.stringify(deleteableObj) });
		vscode.postMessage({
			type: 'delete',
			json: JSON.stringify(deleteableObj)
		});

	}
	var add = document.getElementById("addButton");

	if (add)
	{
		add.addEventListener('click', () =>
		{
			//create tr
			const tr = document.createElement("tr");



			//create key td
			const key = document.createElement("td");
			const keyInput = /** @type {HTMLInputElement} */ document.createElement('input');
			keyInput.type = 'text';
			keyInput.value = "";

			//keyInput.onfocus =(key) =>inputEvent(key);
			keyInput.addEventListener('focusout', inputEvent, false);
			key.appendChild(keyInput);

			//create value td
			const value = document.createElement("td");
			const valueInput = /** @type {HTMLInputElement} */document.createElement('input');
			valueInput.value = ""
			valueInput.type = 'text';

			valueInput.addEventListener('focusout', inputEvent, false)
			value.appendChild(valueInput);

			//create comment td
			const comment = document.createElement("td");
			const commentInput = document.createElement('input');
			commentInput.type = 'text';
			commentInput.value = "";

			commentInput.addEventListener('focusout', inputEvent, false);

			comment.appendChild(commentInput);

			//delete character X
			const x = document.createElement("td");
			const p = document.createElement("p");
			p.innerHTML = "X";
			p.setAttribute("style", "align:center");
			x.appendChild(p);
			//x.onclick = () => deleteEvent(tr);
			// add key value comment tds to tr
			tr.append(key, value, comment, x);

			//add tr to table 
			table.appendChild(tr);
		});
	}

	let currentResxJS = [];

	function updateContent(/** @type {string} */ text)
	{

		let json;
		try
		{
			currentResxJS = json = JSON.parse(text);
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


		var i = 0;
		for (const node of json)
		{

			//create tr
			const tr = document.createElement("tr");
			//create key td
			const key = document.createElement("td");
			const keyInput = /** @type {HTMLInputElement} */ document.createElement('input');
			keyInput.type = 'text';
			keyInput.value = node._attributes.name ?? "";
			console.log("key : " + node._attributes.name ?? "");
			//keyInput.oninput =(key) =>inputEvent(key);;
			keyInput.id = `${i}.key`;
			keyInput.addEventListener('focusout', inputEvent, false);
			key.appendChild(keyInput);

			//create value td
			const value = document.createElement("td");
			const valueInput = document.createElement('input');
			valueInput.value = node.value._text ?? ""
			valueInput.type = 'text';
			valueInput.id = `${i}.value`;
			console.log("Value : " + node.value._text ?? "");
			valueInput.addEventListener('focusout', inputEvent, false);
			value.appendChild(valueInput);

			//create comment td
			const comment = document.createElement("td");
			const commentInput = document.createElement('input');
			commentInput.id = `${i}.comment`;
			commentInput.type = 'text';
			commentInput.value = node.comment._text ?? "";

			console.log("comment : " + node.comment._text ?? "");
			commentInput.addEventListener('focusout', inputEvent, false);
			comment.appendChild(commentInput);

			//delete character X
			const x = document.createElement("td");
			x.id = `${i}.delete`;
			const p = document.createElement("p");
			p.innerHTML = "X";
			p.setAttribute("style", "align:center");
			x.appendChild(p);
			x.addEventListener('click',deleteEvent, false);


			tr.append(key, value, comment, x);

			//add tr to table 
			table.appendChild(tr);
			i++;
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
