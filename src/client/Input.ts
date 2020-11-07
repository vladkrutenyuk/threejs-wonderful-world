export class Input {
    public mousePosition: {
        x: number,
        y: number
    }

    public Start() {
        document.addEventListener('mousemove', this.OnMouseMove, false)
    }

    private OnMouseMove(event: MouseEvent) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
    }
}