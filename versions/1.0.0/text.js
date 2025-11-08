const jsonCache = {};

const altMap = new Map();
window.addEventListener('load', () => {
    document.querySelectorAll('text[alt]').forEach(el => {
        const safeNode = document.createTextNode(el.getAttribute('alt'));
        el.insertBefore(safeNode, el.firstChild);
        altMap.set(el, safeNode);
    });
});


async function updateTitle() {
    const titleEl = document.querySelector('title');

    // If no src attribute, do nothing
    const src = titleEl.getAttribute('src');
    if (!src) return;

    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'en';

    // Determine the key in JSON
    const id = titleEl.getAttribute('id') || 'title';

    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to load ${src}`);
        jsonCache[src] = await response.json();
        const jsonData = jsonCache[src];
        if (jsonData[id] && jsonData[id][lang]) {
            document.title = jsonData[id][lang];
        } else {
            console.warn(`Missing "${id}" entry or "${lang}" translation in ${src}`);
        }
    } catch (err) {
        console.error(err);
    }
}

// Call it as soon as possible
updateTitle();

async function replaceTextFromJSON() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'en';

    let elements;
    do{
        elements = document.querySelectorAll('text[id][src]');

        for (const el of elements) {
            const id = el.getAttribute('id');
            const src = el.getAttribute('src');
            const alt = el.getAttribute('alt');

            if (!jsonCache[src]) {
                try {
                    const response = await fetch(src);
                    if (!response.ok) throw new Error(`Failed to load ${src}`);
                    jsonCache[src] = await response.json();
                } catch (err) {
                    console.error(err);
                    const tempDiv = document.createElement('div');
                    const originalContent = el.innerHTML;
                    tempDiv.innerHTML = originalContent;
                    const fragment = document.createDocumentFragment();
                    while (tempDiv.firstChild) {
                        fragment.appendChild(tempDiv.firstChild);
                    }
                    el.replaceWith(fragment);
                    continue;
                }
            }

            const jsonData = jsonCache[src];
            let replacementText;
            if (jsonData[id] && jsonData[id][lang]) {
                const safeNode = altMap.get(el);
                if(safeNode) el.removeChild(safeNode);
                replacementText = jsonData[id][lang];
            } else {
                console.warn(`Missing translation for id="${id}" and lang="${lang}"`);
                const tempDiv = document.createElement('div');
                const originalContent = el.innerHTML;
                tempDiv.innerHTML = originalContent;
                const fragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                el.replaceWith(fragment);
                continue;
            }
            
            const originalContent = el.innerHTML;

            const safeReplacementNode = document.createTextNode(replacementText);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = originalContent;

            const fragment = document.createDocumentFragment();
            fragment.appendChild(safeReplacementNode);
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            el.replaceWith(fragment);
        }
    }while(elements.length>0);
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', replaceTextFromJSON);