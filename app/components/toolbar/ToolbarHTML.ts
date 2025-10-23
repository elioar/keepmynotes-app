export function getToolbarPlusHTML(): string {
  return `
    <div class="toolbar-plus">
      <button id="add-image" class="plus-option" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'addImage'}))" aria-label="Add Image">
        <span class="icon-image"></span>
        <span class="plus-option-text">Image</span>
      </button>
      <button id="add-recording" class="plus-option" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'addRecording'}))" aria-label="Add Recording">
        <span class="icon-audio"></span>
        <span class="plus-option-text">Audio</span>
      </button>
      <button id="add-checkbox" class="plus-option" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'addCheckbox'}))" aria-label="Add Checkbox">
        <span class="icon-task"></span>
        <span class="plus-option-text">Task</span>
      </button>
    </div>
  `;
}

export function getToolbarMainHTML(): string {
  return `
    <div class="toolbar-main">
      <button id="plus" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'togglePlusRow'}))" aria-label="Add Content">
        <span class="format-icon plus-icon">+</span>
      </button>
      <button id="bold" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'bold'}))" aria-label="Bold">
        <span class="format-icon bold">B</span>
      </button>
      <button id="italic" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'italic'}))" aria-label="Italic">
        <span class="format-icon italic">I</span>
      </button>
      <button id="underline" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'underline'}))" aria-label="Underline">
        <span class="format-icon underline">U</span>
      </button>
      <button id="highlight" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'toggleColorRow'}))" aria-label="Highlight">
        <span class="highlight-icon"></span>
      </button>
      <button id="list-ol" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'insertOrderedList'}))" aria-label="Numbered List">
        <span class="format-icon list-ol">123</span>
      </button>
      <button id="list-ul" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'insertUnorderedList'}))" aria-label="Bullet List">
        <span class="format-icon list-ul"></span>
      </button>
      <button id="align-left" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'justifyLeft'}))" aria-label="Align Left">
        <span class="format-icon align align-left"></span>
      </button>
      <button id="align-center" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'justifyCenter'}))" aria-label="Align Center">
        <span class="format-icon align align-center"></span>
      </button>
      <button id="align-right" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'format', command: 'justifyRight'}))" aria-label="Align Right">
        <span class="format-icon align align-right"></span>
      </button>
    </div>
  `;
}

export function getToolbarColorsHTML(): string {
  const colors = [
    { id: 'yellow', color: '#FFE57F', label: 'Κίτρινο' },
    { id: 'green', color: '#A5D6A7', label: 'Πράσινο' },
    { id: 'blue', color: '#90CAF9', label: 'Μπλε' },
    { id: 'pink', color: '#F48FB1', label: 'Ροζ' },
    { id: 'purple', color: '#B39DDB', label: 'Μωβ' },
    { id: 'cyan', color: '#81D4FA', label: 'Γαλάζιο' },
    { id: 'orange', color: '#FFAB91', label: 'Πορτοκαλί' },
    { id: 'lime', color: '#E6EE9C', label: 'Λαχανί' }
  ];

  const colorButtons = colors.map(color => 
    `<button id="${color.id}" class="color-button" style="--color: ${color.color}" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'setHighlightColor', color: '${color.color}'}))" aria-label="${color.label}"></button>`
  ).join('');

  return `
    <div class="toolbar-colors">
      <button id="remove-color" class="color-button" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'removeHighlightColor'}))" aria-label="Χωρίς χρώμα">
        <span class="no-color-icon"></span>
      </button>
      ${colorButtons}
    </div>
  `;
}
