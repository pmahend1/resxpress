// @ts-check
let currentResxJS = [];

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
		errorContainer.innerText = '';
		let idstr = this.id;
		console.log('input event for id = ' + idstr);
		var index = idstr.split('.')[0];
		console.log('index is :' + index);
		if (index >= currentResxJS.length)
		{

			console.log('This is the new shit ' + index + ' ' + currentResxJS.length);
			// This is the new shit
			// Stand up and admit
			// Do we get it? "Yeah!"
			// Do we want it? "Yeah!"
			// This is the new shit

			var newObj = { _attributes: { name: '', 'xml:space': 'preserve' }, value: { _text: '' } };
			const key =  /** @type {HTMLInputElement} */ (document.getElementById(`${index}.key`));
			const value = /** @type {HTMLInputElement} */ (document.getElementById(`${index}.value`));
			const comment =  /** @type {HTMLInputElement} */ (document.getElementById(`${index}.comment`));


			console.log('if check');
			if (key?.value && value?.value)
			{
				newObj._attributes.name = key?.value ?? "";
				newObj.value._text = value?.value ?? "";
				if (comment?.value)
				{
					newObj.comment = { _text: comment?.value };
				} else
				{
					delete newObj.comment;
				}

				console.log('newObj set');
				var pos = currentResxJS.map(x =>  x?._attributes?.name ).indexOf(newObj._attributes.name);

				//avoid adding data with same key
				if (pos === -1)
				{
					currentResxJS.push(newObj);
					console.log('Input event : ' + JSON.stringify(newObj));

					errorContainer.innerText = '';
					errorContainer.style.display = '';

					vscode.setState({ text: JSON.stringify(currentResxJS) });
					vscode.postMessage({
						type: 'add',
						json: JSON.stringify(newObj)
					});
				} else
				{
					console.log('has dupes ');
					errorContainer.innerText = `Error: Data with ${newObj._attributes.name} already exists`;
					errorContainer.style.display = '';
					return;

				}




			} else
			{
				errorContainer.innerText = 'Key and Value are both mandatory fields!';
				errorContainer.style.display = '';
				return;
			}

		} else
		{
			//old shit

			console.log('old shit');
			var editingObj = currentResxJS[index];

			const key =  /** @type {HTMLInputElement} */ (document.getElementById(`${index}.key`));
			const value = /** @type {HTMLInputElement} */ (document.getElementById(`${index}.value`));
			const comment =  /** @type {HTMLInputElement} */ (document.getElementById(`${index}.comment`));

			if (key.value && value.value)//
			{

				console.log('Changing values');
				editingObj._attributes.name = key.value ?? "";
				editingObj.value._text = value.value ?? "";
				if (comment?.value)
				{
					editingObj.comment = { _text: comment?.value };
				} else
				{
					delete editingObj.comment;

				}

				var tempArray = Array.from(currentResxJS);
				tempArray[index] = editingObj;

				

				var keyArray = tempArray.map(x => x._attributes.name);

				console.log('keyArray is ' + JSON.stringify(keyArray));
				if (new Set(keyArray).size !== keyArray.length)
				{
					console.log('edited Data key already exists');
					errorContainer.innerText = `Error while updating data : Data with ${editingObj._attributes.name} already exists`;
					errorContainer.style.display = '';

				} else
				{
					currentResxJS[index] = editingObj;
				}



			} else
			{
				errorContainer.innerText = 'Error: Document is not valid resx';
				errorContainer.style.display = '';
				return;
			}


			console.log('Input event : ' + JSON.stringify(currentResxJS));
			vscode.setState({ text: JSON.stringify(currentResxJS) });
			vscode.postMessage({
				type: 'update',
				json: JSON.stringify(currentResxJS)
			});
		}


	};

	function deleteEvent()
	{
		errorContainer.innerText = '';
		let idstr = this.id;
		console.log('id to be deleted = ' + idstr);
		var index = idstr.split('.')[0];

		if (currentResxJS.length > index)
		{
			var deleteableObj = currentResxJS[index];

			//x=td -> tr -> tbody-> table
			var row = /** @type {HTMLTableElement} */ this.parentNode;
			row.parentNode.removeChild(row);

			vscode.setState({ text: JSON.stringify(currentResxJS) });//always set the full list

			vscode.postMessage({
				type: 'delete',
				json: JSON.stringify(deleteableObj)
			});

		} else
		{
			// This is the new shit
			// Stand up and admit
			// Do we get it? "No!"
			// Do we want it? "No!"
			// This is the new shit
			var row = /** @type {HTMLTableElement} */ this.parentNode;
			row.parentNode.removeChild(row);
		}


	}
	var add = document.getElementById("addButton");

	if (add)
	{
		add.addEventListener('click', () =>
		{
			//create tr
			const tr = document.createElement("tr");

			var index = (currentResxJS.length > 0) ? currentResxJS.length + 1 : 0;

			//create key td
			const key = document.createElement("td");
			const keyInput = /** @type {HTMLInputElement} */ document.createElement('input');
			keyInput.id = `${index}.key`;
			keyInput.type = 'text';
			keyInput.value = "";

			//keyInput.onfocus =(key) =>inputEvent(key);
			keyInput.addEventListener('focusout', inputEvent, false);
			key.appendChild(keyInput);

			//create value td
			const value = document.createElement("td");
			const valueInput = /** @type {HTMLInputElement} */document.createElement('input');
			valueInput.id = `${index}.value`;
			valueInput.value = ""
			valueInput.type = 'text';

			valueInput.addEventListener('focusout', inputEvent, false)
			value.appendChild(valueInput);

			//create comment td
			const comment = document.createElement("td");

			const commentInput = document.createElement('input');
			commentInput.id = `${index}.comment`;
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

			x.addEventListener('click', deleteEvent, false);
			tr.append(key, value, comment, x);

			//add tr to table 
			table.appendChild(tr);
		});
	}



	function updateContent(/** @type {string} */ text)
	{
		if (text)
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

				if (node)
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
					commentInput.value = node?.comment?._text ?? "";

					console.log("comment : " + node?.comment?._text ?? "");
					commentInput.addEventListener('focusout', inputEvent, false);
					comment.appendChild(commentInput);

					//delete character X
					const x = document.createElement("td");
					x.id = `${i}.delete`;
					const p = document.createElement("p");
					p.innerHTML = "X";
					x.appendChild(p);
					x.addEventListener('click', deleteEvent, false);


					tr.append(key, value, comment, x);

					//add tr to table 
					table.appendChild(tr);
					i++;
				} else
				{
					console.log('node is undefined or null');
				}

			}
		} else
		{
			table.style.display = 'none';
			errorContainer.innerText = 'Error: Document is not valid resx';
			errorContainer.style.display = '';
			return;
		}


	}
	window.addEventListener('message', event =>
	{
		const message = event.data; // The json data that the extension sent
		switch (message.type)
		{
			case 'update':
				const text = message.text;
				// if (text != vscode.getState()?.text)
				// {
				// 	// Update our webview's content
				// 	updateContent(text);
				// }
				var sentDataListJs = JSON.parse(text) ?? [];

				if (sentDataListJs.length !== currentResxJS.length)
				{
					console.log('Sent data is not same as current webview data');

					console.log('Sent data as json ' + text);
					console.log('Current data as json ' + JSON.stringify(currentResxJS));
					updateContent(text);
				}
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
