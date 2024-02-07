// @ts-check
let currentResxJS: any = [];

// Script run within the webview itself.
(function () {
	// @ts-ignore
	const vscode = acquireVsCodeApi();


	let table = document.querySelector("tbody")!;


	const errorContainer = document.getElementById('diverr');

	function inputEvent(event: FocusEvent) {
		let currentElement = event.target;

		if (errorContainer != null && currentElement instanceof HTMLInputElement) {
			errorContainer.innerText = '';
			let idstr = currentElement.id;
			console.log('input event for id = ' + idstr);
			var index = Number(idstr.split('.')[0]);
			console.log('index is :' + index);
			if (index >= currentResxJS.length) {

				console.log(`Index: ${index}. Current Resx Length: ${currentResxJS.length}`);
				var newObj: any = { _attributes: { name: '', 'xml:space': 'preserve' }, value: { _text: '' } };
				const key = document.getElementById(`${index}.key`) as HTMLInputElement;
				const value = document.getElementById(`${index}.value`);
				const comment = document.getElementById(`${index}.comment`);

				console.log('if check');
				if (key instanceof HTMLInputElement && value instanceof HTMLInputElement && comment instanceof HTMLInputElement) {
					if (key.value && value.value) {
						newObj._attributes.name = key?.value ?? "";
						newObj.value._text = value?.value ?? "";
						if (comment.value) {
							newObj.comment = { _text: comment?.value };
						}
						else {
							delete newObj.comment;
						}

						console.log('newObj set');
						var pos = currentResxJS.map((x: any) => x?._attributes?.name).indexOf(newObj._attributes.name);

						//avoid adding data with same key
						if (pos === -1) {
							currentResxJS.push(newObj);
							console.log('Input event : ' + JSON.stringify(newObj));

							errorContainer.innerText = '';
							errorContainer.style.display = '';

							vscode.setState({ text: JSON.stringify(currentResxJS) });
							vscode.postMessage({
								type: 'add',
								json: JSON.stringify(newObj)
							});
						}
						else {
							console.log('has dupes ');
							errorContainer.innerText = `Error: Data with ${newObj._attributes.name} already exists`;
							errorContainer.style.display = '';
							return;
						}
					}
					else {
						errorContainer.innerText = 'Key and Value are both mandatory fields!';
						errorContainer.style.display = '';
						return;
					}
				}


			}
			else {
				var editingObj = currentResxJS[index];

				const key = document.getElementById(`${index}.key`);
				const value = document.getElementById(`${index}.value`);
				const comment = document.getElementById(`${index}.comment`);

				if (key instanceof HTMLInputElement && value instanceof HTMLInputElement && comment instanceof HTMLInputElement) {
					if (key.value && value.value) {

						console.log('Changing values');
						editingObj._attributes.name = key.value ?? "";
						editingObj.value._text = value.value ?? "";
						if (comment?.value) {
							editingObj.comment = { _text: comment?.value };
						}
						else {
							delete editingObj.comment;
						}

						var tempArray = Array.from(currentResxJS);
						tempArray[index] = editingObj;

						var keyArray = tempArray.map((x: any) => x._attributes.name);

						console.log('keyArray is ' + JSON.stringify(keyArray));
						if (new Set(keyArray).size !== keyArray.length) {
							console.log('edited Data key already exists');
							errorContainer.innerText = `Error while updating data : Data with ${editingObj._attributes.name} already exists`;
							errorContainer.style.display = '';
						}
						else {
							currentResxJS[index] = editingObj;
						}
					}
					else {
						errorContainer.innerText = 'Error: Document is not valid resx';
						errorContainer.style.display = '';
						return;
					}

				}



				console.log('Input event : ' + JSON.stringify(currentResxJS));
				vscode.setState({ text: JSON.stringify(currentResxJS) });
				vscode.postMessage({
					type: 'update',
					json: JSON.stringify(currentResxJS)
				});
			}
		}
	};

	function deleteEvent(event: MouseEvent) {
		console.log(`deleteEvent triggered with ${event.target}`);
		const td = event.target as HTMLElement;
		let table = document.getElementById("tbl");
		if (errorContainer != null && table && td) {
			let idstr: string = td.id;
			console.log(`Triggered td.id : ${idstr}`);
			errorContainer.innerText = '';
		
			if (idstr && idstr.trim()) {
				let indices = idstr.split('.');
				
				if (indices.length > 0) {
					let index = Number(indices[0]);
					console.log(`index to be deleted: ${index}`)
					if (currentResxJS.length > index) {
						var deleteableObj = currentResxJS[index];

						//x=td -> tr -> tbody-> table
						let row = td.parentNode;
						if (row) {
							row.parentNode?.removeChild(row);
						}


						vscode.setState({ text: JSON.stringify(currentResxJS) });//always set the full list

						vscode.postMessage({
							type: 'delete',
							json: JSON.stringify(deleteableObj)
						});
					}
					else {
						let row = td.parentNode;
						if (row) {
							row.parentNode?.removeChild(row);
						}
					}
				}
			}


		}
	}
	let namespace = document.getElementById("namespace");
	if (namespace) {
		namespace.addEventListener("click", () => {
			namespace?.removeAttribute("disabled");
		});
	}

	//content
	let content = document.getElementById("content");
	if (content) {
		content.addEventListener("click", () => {
			namespace?.removeAttribute("disabled");
		});
	}
	var add = document.getElementById("addButton");

	var switchToTextEditor = document.getElementById('switchToEditor');

	if (switchToTextEditor) {
		switchToTextEditor.addEventListener('click', async () => {
			vscode.postMessage({
				type: 'switch',
				json: JSON.stringify("")
			});

		});
	}

	if (add) {
		add.addEventListener('click', () => {
			console.log("Add clicked");
			//create tr
			let tr = document.createElement("tr");

			let index = (currentResxJS.length > 0) ? currentResxJS.length : 0;

			//create key td
			let key = document.createElement("td");
			const keyInput = document.createElement('input');
			keyInput.id = `${index}.key`;
			keyInput.type = 'text';
			keyInput.value = "";

			//keyInput.onfocus =(key) =>inputEvent(key);
			keyInput.addEventListener('focusout', (ev) => inputEvent, false);
			key.appendChild(keyInput);

			//create value td
			const value = document.createElement("td");
			const valueInput = document.createElement('input');
			valueInput.id = `${index}.value`;
			valueInput.value = "";
			valueInput.type = 'text';

			valueInput.addEventListener('focusout', inputEvent, false);
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
			const deleteTd = document.createElement("td");
			deleteTd.id = `${index}.delete.td`;
			let p = document.createElement("p");
			p.id = `${index}.delete.p`;
			p.innerHTML = "X";
			//p.setAttribute("style", "align:center");
			deleteTd.appendChild(p);

			deleteTd.addEventListener('click', (ev) => deleteEvent(ev), false);
			tr.append(key, value, comment, deleteTd);

			//add tr to table 
			table.appendChild(tr);
		});
	}

	function updateContent(text: string) {
		if (errorContainer != null) {
			if (text) {
				let json;
				try {
					currentResxJS = json = JSON.parse(text);
					console.log("data json is :" + text);
				}
				catch {
					table.style.display = 'none';
					errorContainer.innerText = 'Error: Document is not valid resx';
					errorContainer.style.display = '';
					return;
				}
				table.style.display = '';
				errorContainer.style.display = 'none';

				// Render the scratches
				table.innerHTML = '';

				var index = 0;
				for (const node of json) {

					if (node) {
						//create tr
						const tr = document.createElement("tr");
						//create key td
						const key = document.createElement("td");
						const keyInput = document.createElement('input');
						keyInput.type = 'text';
						keyInput.value = node._attributes.name ?? "";
						console.log("key : " + node._attributes.name ?? "");

						keyInput.id = `${index}.key`;
						keyInput.addEventListener('focusout', inputEvent, false);
						key.appendChild(keyInput);

						//create value td
						const value = document.createElement("td");
						const valueInput = document.createElement('input');
						valueInput.value = node.value._text ?? "";
						valueInput.type = 'text';
						valueInput.id = `${index}.value`;
						console.log("Value : " + node.value._text ?? "");
						valueInput.addEventListener('focusout', inputEvent, false);
						value.appendChild(valueInput);

						//create comment td
						const comment = document.createElement("td");
						const commentInput = document.createElement('input');
						commentInput.id = `${index}.comment`;
						commentInput.type = 'text';
						commentInput.value = node?.comment?._text ?? "";

						console.log("comment : " + node?.comment?._text ?? "");
						commentInput.addEventListener('focusout', inputEvent, false);
						comment.appendChild(commentInput);

						//delete character X
						const deleteTd = document.createElement("td");
						deleteTd.id = `${index}.delete.td`;
						const p = document.createElement("p");
						p.id = `${index}.delete.p`;
						p.innerHTML = "X";
						deleteTd.appendChild(p);
						deleteTd.addEventListener('click', (ev) => deleteEvent(ev), false);


						tr.append(key, value, comment, deleteTd);

						//add tr to table 
						table.appendChild(tr);
						index++;
					}
					else {
						console.log('node is undefined or null');
					}
				}
			}
			else {
				table.style.display = 'none';
				errorContainer.innerText = 'Error: Document is not valid resx';
				errorContainer.style.display = '';
				return;
			}
		}
	}

	let body = document.getElementById("body");
	if (body) {

	}


	window.addEventListener('message', event => {
		const message = event.data; // The json data that the extension sent
		switch (message.type) {
			case 'update':
				const text = message.text;
				var sentDataListJs = JSON.parse(text) ?? [];

				if (sentDataListJs.length !== currentResxJS.length) {
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
	if (state) {
		updateContent(state.text);
	}
}());
