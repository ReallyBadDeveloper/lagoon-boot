document.getElementById('start').addEventListener('click', async () => {
	let terminalElement = document.querySelector('p')
	terminalElement.style.display = 'block'
	document.getElementById('start').style.display = 'none'
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

	const terminalAPI = {}
	window.terminalAPI = terminalAPI
	terminalAPI.write = (text) => {
		terminalElement.textContent += text
	}
	terminalAPI.clear = () => {
		terminalElement.textContent = ''
	}
	terminalAPI.getInput = () => {
		return new Promise((r) => {
			let text = ''
			let answerSpan = document.createElement('span')
			terminalElement.appendChild(answerSpan)
			const keyListener = (ev) => {
				console.log(ev.key)
				if (ev.key.length == 1) {
					answerSpan.textContent += ev.key
					text += ev.key
				} else {
					switch (ev.key) {
						case 'Enter':
							window.removeEventListener('keydown', keyListener)
							answerSpan.textContent += '\n'
							r(text)
							break
						case 'Backspace':
							text = text.slice(0, text.length - 1)
							answerSpan.textContent = text
							console.log(text)
							break
						default:
							break
					}
				}
			}
			Object.freeze(window.terminalAPI)
			window.addEventListener('keydown', keyListener)
		})
	}
	terminalAPI.clear()
	terminalAPI.write('Requesting permission to a folder to boot from\n')
	let rootDirectory = await window.showDirectoryPicker({
		mode: 'readwrite',
	})
	window.rootDirectory = rootDirectory
	console.log(rootDirectory)

	const fsAPI = {}
	window.fsAPI = fsAPI

	fsAPI.readFileAsync = function (file, isText = true) {
		return new Promise((resolve, reject) => {
			let reader = new FileReader()
			reader.onload = () => {
				resolve(reader.result)
			}
			reader.onerror = reject
			if (!isText) reader.readAsArrayBuffer(file)
			if (isText) reader.readAsText(file)
		})
	}

	fsAPI.writeFileAsync = function (file, data) {
		return new Promise((resolve, reject) => {
			let stream = file.createWritable
			stream.write({ type: 'truncate', size: 0 })
			stream.write(data)
			stream.close()
		})
	}

	fsAPI.FindFileInDir = async function (dir, name) {
		for await (const handle of dir.values()) {
			if (handle.kind == 'file') {
				let file = await handle.getFile()
				if (file.name == name) {
					return file
				}
			}
		}
	}

	Object.freeze(window.fsAPI)

	const lgbAPI = {}
	window.lgbAPI = lgbAPI
	lgbAPI.sleep = sleep

	lgbAPI.loadScript = async function (dir, file) {
		src = await fsAPI.readFileAsync(await fsAPI.FindFileInDir(dir, file))
		new Function(`;(async()=>{${src}})();`).call()
	}

	let osConf = (
		await fsAPI.readFileAsync(
			await fsAPI.FindFileInDir(rootDirectory, 'os.conf')
		)
	)
		.split('\n')
		.map((e) => e.split('='))
	let mainName = osConf.find((e) => e[0] == 'main')[1]
	if (mainName) {
		terminalAPI.write('Loading OS...')
		let mainContents = await fsAPI.readFileAsync(
			await fsAPI.FindFileInDir(rootDirectory, mainName)
		)
		await sleep(100)

		new Function(`;(async()=>{${mainContents}})();`).call()
		//eval(";(async()=>{"+mainContents+"})();")
		return
	}
	terminalAPI.write('Failed to find main in os.conf\n')
})
