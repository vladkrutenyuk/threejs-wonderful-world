class Input {
    private doc: Document;
    public mousePosition: {
        x: number,
        y: number
    }

    constructor(doc: Document) {
        this.doc = doc;
    }

    public Start() {
        this.doc.addEventListener('mousemove', this.OnMouseMove, false)
    }

    private OnMouseMove(event: MouseEvent) {
        this.mousePosition.x = 1;

    }
}