declare global {
	interface Window {
		electronAPI: {
			scan: (method: ScanMethod) => Promise<ScanResult>
			saveOutput: (content: string, format: 'html' | 'txt') => Promise<SaveResult>
			onLog: (cb: (msg: string) => void) => void
			clearLogListeners: () => void
		}
	}
}

type ScanMethod = 'safari' | 'cdp' | 'clipboard'

interface ScanResult {
	success: boolean
	error?: string
	title?: string
	url?: string
	matches?: Array<{ name: string; count: number; hasBlurb: boolean }>
	assembled?: string
}

interface SaveResult {
	success: boolean
	cancelled?: boolean
	filePath?: string
	error?: string
}

const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement
const methodSelect = document.getElementById('method-select') as HTMLSelectElement
const logPanel = document.getElementById('log-panel') as HTMLPreElement
const resultsSection = document.getElementById('results-section') as HTMLElement
const matchesContainer = document.getElementById('matches-container') as HTMLElement
const letterOutput = document.getElementById('letter-output') as HTMLTextAreaElement
const saveHtmlBtn = document.getElementById('save-html-btn') as HTMLButtonElement
const saveTxtBtn = document.getElementById('save-txt-btn') as HTMLButtonElement
const statusBar = document.getElementById('status-bar') as HTMLElement

let currentAssembled = ''

function appendLog(msg: string): void {
	logPanel.textContent += msg + '\n'
	logPanel.scrollTop = logPanel.scrollHeight
}

type StatusType = 'idle' | 'running' | 'success' | 'error'

function setStatus(msg: string, type: StatusType): void {
	statusBar.textContent = msg
	statusBar.className = `status-bar status-${type}`
}

const isMac = navigator.platform.toLowerCase().startsWith('mac')
methodSelect.value = isMac ? 'safari' : 'cdp'

window.electronAPI.onLog(appendLog)

scanBtn.addEventListener('click', async () => {
	const method = methodSelect.value as ScanMethod

	logPanel.textContent = ''
	resultsSection.style.display = 'none'
	matchesContainer.innerHTML = ''
	letterOutput.value = ''
	currentAssembled = ''
	scanBtn.disabled = true

	setStatus('Scanning...', 'running')

	window.electronAPI.clearLogListeners()
	window.electronAPI.onLog(appendLog)

	try {
		const result = await window.electronAPI.scan(method)

		if (!result.success) {
			setStatus(`Error: ${result.error ?? 'Unknown error'}`, 'error')
			return
		}

		resultsSection.style.display = 'block'

		if (result.matches && result.matches.length > 0) {
			const maxCount = Math.max(...result.matches.map((m) => m.count))

			matchesContainer.innerHTML = result.matches
				.slice(0, 20)
				.map((m) => {
					const pct = Math.round((m.count / maxCount) * 100)
					const icon = m.hasBlurb ? 'Y' : 'N'
					const cls = m.hasBlurb ? 'has-blurb' : 'no-blurb'
					return `
          <div class="match-row">
            <div class="bar-track">
              <div class="bar-fill ${cls}" style="width:${pct}%"></div>
            </div>
            <span class="match-name">${m.name}</span>
            <span class="match-count">×${m.count}</span>
            <span class="match-icon ${cls}">${icon}</span>
          </div>`
				})
				.join('')
		} else {
			matchesContainer.innerHTML = '<p class="no-matches">No keyword matches found.</p>'
		}

		currentAssembled = result.assembled ?? ''
		letterOutput.value = currentAssembled
			.replace(/<[^>]+>/g, '')
			.replace(/\s+/g, ' ')
			.trim()

		const matchCount = result.matches?.length ?? 0
		setStatus(
			`Done: ${matchCount} keyword${matchCount !== 1 ? 's' : ''} matched` +
				(result.title ? ` from "${result.title}"` : ''),
			'success'
		)
	} finally {
		scanBtn.disabled = false
	}
})

async function handleSave(format: 'html' | 'txt'): Promise<void> {
	if (!currentAssembled) {
		setStatus('Nothing to save', 'error')
		return
	}
	const result = await window.electronAPI.saveOutput(currentAssembled, format)
	if (result.success) {
		setStatus(`Saved to ${result.filePath}`, 'success')
	} else if (!result.cancelled) {
		setStatus(`Save failed: ${result.error}`, 'error')
	}
}

saveHtmlBtn.addEventListener('click', () => handleSave('html'))
saveTxtBtn.addEventListener('click', () => handleSave('txt'))

export {}
