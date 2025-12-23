const colors = ['yellow', 'blue', 'red', 'green'];
const controls = new Array(colors.length);
const control_container = document.getElementById('controls');
const tanks = new Array(colors.length);
const tanks_container = document.getElementById('tanks');
const bullets = new Array();
const bullets_container = document.getElementById('bullets');

class control {
    id = '';
    down = false;
    element = null;
    constructor(id) {
        this.id = id;
        this.element = control_container.appendChild(document.createElement('img'));
        this.element.src = `assets/controls/control.${this.id}.svg`;
        this.element.id = this.id;

        this.element.addEventListener('pointerdown', () => {
            this.down = true;
            this.element.src = `assets/controls/control.${this.id}.down.svg`;
        });

        this.element.addEventListener('pointerup', () => {
            this.down = false;
            this.element.src = `assets/controls/control.${this.id}.svg`;
        });

        this.element.addEventListener('pointerleave', () => {
            this.down = false;
            this.element.src = `assets/controls/control.${this.id}.svg`;
        });
    }
}
class tank {
    id = 0;
    destroyed = false;
    shooted = false;
    x = 500;
    y = 500;
    direction = 0;
    element = null;
    constructor(id) {
        switch (id) {
            case colors[0]:
                this.x = 200;
                this.y = 200;
                break;
            case colors[1]:
                this.x = 800;
                this.y = 200;
                break;
            case colors[2]:
                this.x = 200;
                this.y = 800;
                break;
            case colors[3]:
                this.x = 800;
                this.y = 800;
                break;
        }
        this.id = id;
        this.element = tanks_container.appendChild(document.createElement('img'));
        // this.element.src = `assets/tanks/tank.${this.id}.svg`;
        this.element.src = `assets/tanks/tank.svg`;
        this.element.id = this.id;
        this.update();
    }
    update(control_down) {
        if (!this.destroyed) {
            if (control_down) {
                if (this.shooted == false) {
                    this.shooted = true;
                    bullets.push(new bullet(this.id, this.x, this.y, this.direction));
                }
                this.x += 1 * Math.sin(this.direction * Math.PI / 180);
                this.y -= 1 * Math.cos(this.direction * Math.PI / 180);
            }
            else {
                this.shooted = false;
                this.direction += 2;
            }
        }
        this.element.style.top = `${this.y / 10}%`;
        this.element.style.left = `${this.x / 10}%`;
        this.element.style.transform = `rotate(${this.direction}deg)`;
    }
}
class bullet {
    id = '';
    x = 0;
    y = 0;
    direction = 0;
    element = null;

    constructor(id, x, y, direction) {
        this.id = id;
        this.element = bullets_container.appendChild(document.createElement('img'));
        this.element.src = `assets/bullets/bullet.svg`;
        this.element.id = this.id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.update();
    }
    update() {
        this.x += 5 * Math.sin(this.direction * Math.PI / 180);
        this.y -= 5 * Math.cos(this.direction * Math.PI / 180);

        this.element.style.top = `${this.y / 10}%`;
        this.element.style.left = `${this.x / 10}%`;
        this.element.style.transform = `rotate(${this.direction}deg)`;
    }
}

function game_setup() {
    const body = document.getElementsByTagName('body')[0];
    body.addEventListener('contextmenu', e => {
        e.preventDefault();
    });
    for (let i = 0; i < colors.length; i++) {
        controls[i] = new control(colors[i]);
        tanks[i] = new tank(colors[i]);
    }
}
const TPS = 60;
const MS_PER_TICK = 1000 / TPS;
let accumulated_time = 0;
let last_time = performance.now();

function game_update(now) {
    accumulated_time += now - last_time;
    last_time = now;
    while (accumulated_time >= MS_PER_TICK) {
        for (let i = 0; i < colors.length; i++) {
            tanks[i].update(controls[i].down);
        }
        for (let i = 0; i < bullets.length; i++) {
            bullets[i].update();
        }
        accumulated_time -= MS_PER_TICK;
    }
    requestAnimationFrame(game_update);
}

game_setup();
requestAnimationFrame(game_update);