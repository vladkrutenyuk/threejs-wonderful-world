const HIDDEN_CLASSNAME = 'hidden'

export function setElementVisibility(element: HTMLElement, isVisible: boolean) {
    if (isVisible) {
        element.classList.remove(HIDDEN_CLASSNAME)
    } else {
        element.classList.add(HIDDEN_CLASSNAME)
    }
}