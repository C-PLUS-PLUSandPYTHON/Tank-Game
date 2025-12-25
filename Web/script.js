//canvas rendering
const canvas = document.body.appendChild(document.createElement('canvas'));
const context = canvas.getContext('2d');
const html = document.documentElement;
let scale;
let canvas_width;
let canvas_height;

//game colors
const colors = ['yellow', 'blue', 'red', 'green'];

//game elements
const controls = new Array(colors.length);
const tanks = new Array(colors.length);
const bullets = new Array();

//game images
const tank_image = new Image();
tank_image.src = 'assets/tanks/tank.svg';
const bullet_image = new Image();
bullet_image.src = 'assets/bullets/bullet.svg';
const control_images = new Array(colors.length);
const control_images_down = new Array(colors.length);
for (let i = 0; i < colors.length; i++) {
    control_images[i] = new Image();
    control_images[i].src = `assets/controls/${colors[i]}.svg`;
    control_images_down[i] = new Image();
    control_images_down[i].src = `assets/controls/${colors[i]}_down.svg`;
}

//constants
const control_size = 190;
const tank_offset = 300;
const tank_size = 50;
const tank_speed = 1.5;
const tank_rotation_speed = 2;
const tank_cooldown = 400;
const bullet_speed = 5;
const bullet_size = 15;
const bg_color = '#D5C69C';

//game timing
const ticks_per_second = 60;
const ms_per_tick = 1000 / ticks_per_second;
let accumulated_time = 0;
let last_time = performance.now();

//mouse detection
let pointers = new Map();

class control {
    id = -1;
    x = 0;
    y = 0;
    direction = 0;
    down = false;
    constructor(id) {
        //check id valid
        this.id = id >= 0 && id < colors.length ? id : -1;
        //set position / rotation based on id
        switch (id) {
            case 0:
                this.x = 0;
                this.y = 0;
                break;
            case 1:
                this.x = 1000 - control_size;
                this.y = 0;
                break;
            case 2:
                this.x = 0;
                this.y = 1000 * 9 / 16 - control_size;
                break;
            case 3:
                this.x = 1000 - control_size;
                this.y = 1000 * 9 / 16 - control_size;
                break;
        }
    }
    update() {
        //check clicked
        this.down = mouse_down_box(this.x, this.y, control_size, control_size);
        if (this.down) {
            console.log(`Control ${this.id} is down`);
        }
    }
    render() {
        //draw it
        if (this.id >= 0 && this.id < colors.length) {
            draw_image(this.down ? control_images_down[this.id] : control_images[this.id], this.x, this.y, control_size, control_size);
        }
    }
}
class tank {
    id = -1;
    destroyed = false;
    cooldown = 0;
    x = 500;
    y = 500;
    direction = 0;
    constructor(id) {
        //check id valid
        this.id = id >= 0 && id < colors.length ? id : -1;
        //set start position based on id
        switch (id) {
            case 0:
                this.x = tank_offset;
                this.y = tank_offset / 16 * 9;
                break;
            case 1:
                this.x = 1000 - tank_offset;
                this.y = tank_offset / 16 * 9;
                break;
            case 2:
                this.x = tank_offset;
                this.y = (1000 - tank_offset) / 16 * 9;
                break;
            case 3:
                this.x = 1000 - tank_offset;
                this.y = (1000 - tank_offset) / 16 * 9;
                break;
        }
    }
    update() {
        //if tank active (not destroyed)
        if (!this.destroyed) {
            //if its control is down
            if (controls[this.id].down) {
                //if it's the first time shooting
                if (this.cooldown == 0) {
                    this.cooldown = tank_cooldown;
                    //shoot (instance a bullet)
                    bullets.push(new bullet(this.id, this.x, this.y, this.direction));
                }
                else {
                    //reset shooting
                    this.cooldown -= ms_per_tick;
                    if (this.cooldown < 0.05) {
                        this.cooldown = 0.05;
                    }
                }
                //move it
                this.x += tank_speed * Math.sin(this.direction * Math.PI / 180);
                this.y -= tank_speed * Math.cos(this.direction * Math.PI / 180);

            }
            //control not down
            else {
                //reset shooting
                this.cooldown -= ms_per_tick;
                if (this.cooldown < 0) {
                    this.cooldown = 0;
                }
                //rotate it
                this.direction += tank_rotation_speed;
                this.direction = this.direction % 360;
            }
        }
    }
    render() {
        //draw it
        if (this.id >= 0 && this.id < colors.length) {
            draw_rotated_image(tank_image, this.x, this.y, tank_size, -1, this.direction);
        }
    }
}
class bullet {
    id = -1;
    x = 0;
    y = 0;
    direction = 0;
    element = null;

    constructor(id, x, y, direction) {
        //check id valid
        this.id = id >= 0 && id < colors.length ? id : -1;
        //set properties
        this.x = x;
        this.y = y;
        this.direction = direction;
    }
    delete() {
        const index = bullets.indexOf(this);
        if (index !== -1) bullets.splice(index, 1);
    }
    update() {
        //move it
        this.x += bullet_speed * Math.sin(this.direction * Math.PI / 180);
        this.y -= bullet_speed * Math.cos(this.direction * Math.PI / 180);

        if (this.x > 1500 || this.y > 1500 * 9 / 16 || this.x < -500 || this.y < -500)
            this.delete();
        for (let i = 0; i < colors.length; i++) {
            const tank = tanks[i];
            if (tank.id != this.id) {
                const radians = this.direction * Math.PI / 180;
                if (circle_collision(this.x + bullet_size * Math.sin(radians), this.y + -bullet_size * Math.cos(radians), 10, tank.x, tank.y, tank_size - 10)) {
                    this.delete();
                    tank.destroyed = true;
                }
            }
        }
    }
    render() {
        //draw it
        if (this.id >= 0 && this.id < colors.length) {
            draw_rotated_image(bullet_image, this.x, this.y, bullet_size, -1, this.direction);
        }
    }
}

function mouse_down_box(x, y, w, h) {
    for (const [id, p] of pointers) {
        if (p.x >= x * scale && p.x <= (x + w) * scale && p.y >= y * scale && p.y <= (y + h) * scale) {
            return true;
        }
    }
    return false;
}
function mouse_down_circle(x, y, r) {
    for (const [id, p] of pointers) {
        const distance = Math.sqrt((p.x - x * scale) ** 2 + (p.y - y * scale) ** 2);
        if (distance <= r * scale) {
            return true;
        }
    }
}

function circle_collision(x, y, r, x2, y2, r2) {
    const distance = Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);
    if (distance < r + r2) {
        return true;
    }
    return false;
}



function draw_image(image, x, y, width, height) {
    height = height == -1 ? width * image.height / image.width : height;
    context.drawImage(image, x * scale, y * scale, width * scale, height * scale);
}
function draw_image_centered(image, x, y, width, height) {
    height = height == -1 ? width * image.height / image.width : height;
    context.drawImage(image, (x - width / 2) * scale, (y - height / 2) * scale, width * scale, height * scale);
}
function draw_rotated_image(image, x, y, width, height, angle) {
    height = height == -1 ? width * image.height / image.width : height;
    context.save();
    context.translate(x * scale, y * scale);
    context.rotate(angle * Math.PI / 180);
    context.drawImage(image, -width / 2 * scale, -height / 2 * scale, width * scale, height * scale);
    context.restore();
}
function fill_rect(x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(x * scale, y * scale, width * scale, height * scale);
}
function draw_rect(x, y, width, height, color, line_width) {
    context.strokeStyle = color;
    context.lineWidth = line_width * scale;
    context.strokeRect(x * scale, y * scale, width * scale, height * scale);
}
function fill_ellipse(x, y, radius_x, radius_y, rotation, fill_color) {
    context.fillStyle = fill_color;
    context.beginPath();
    context.ellipse(x * scale, y * scale, radius_x * scale, radius_y * scale, rotation * Math.PI / 180, 0, 2 * Math.PI);
    context.fill();
}
function draw_ellipse(x, y, radius_x, radius_y, rotation, stroke_color, line_width) {
    context.strokeStyle = stroke_color;
    context.lineWidth = line_width * scale;
    context.beginPath();
    context.ellipse(x * scale, y * scale, radius_x * scale, radius_y * scale, rotation * Math.PI / 180, 0, 2 * Math.PI);
    context.stroke();
}
function game_setup() {
    document.body.style.cssText = "background-color: #000000; margin: 0; padding: 0; overflow: hidden;";
    canvas.style.cssText = "position: absolute; transform: translate(-50%, -50%); top: 50%; left: 50%; touch-action: none;";

    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
    });
    window.addEventListener("pointerdown", e => {
        pointers.set(e.pointerId, getPos(e));
    });
    window.addEventListener("pointermove", e => {
        if (pointers.has(e.pointerId)) {
            pointers.set(e.pointerId, getPos(e));
        }
    });
    window.addEventListener("pointerup", e => {
        pointers.delete(e.pointerId);
    });
    window.addEventListener("pointercancel", e => {
        pointers.delete(e.pointerId);
    });
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left, y: e.clientY - rect.top, button: e.button, type: e.pointerType // "mouse", "touch", "pen"
        };
    }

    for (let i = 0; i < colors.length; i++) {
        controls[i] = new control(i);
        tanks[i] = new tank(i);
    }
}
function game_update() {
    for (let i = 0; i < colors.length; i++) {
        controls[i].update();
        tanks[i].update();
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
    }
}
function game_render() {
    canvas_width = Math.min(html.clientWidth, html.clientHeight * 16 / 9);
    canvas_height = Math.min(html.clientHeight, html.clientWidth * 9 / 16);
    scale = canvas_width / 1000;
    canvas.width = canvas_width;
    canvas.height = canvas_height;
    fill_rect(0, 0, canvas.width / scale, canvas.height / scale, bg_color);

    for (let i = 0; i < bullets.length; i++) {
        bullets[i].render();
    }
    for (let i = 0; i < colors.length; i++) {
        tanks[i].render();
    }
    for (let i = 0; i < colors.length; i++) {
        controls[i].render();
    }
    for (let [id, p] of pointers) {
        fill_ellipse(p.x / scale, p.y / scale, 15, 15, 0, '#ffffff69');
        draw_ellipse(p.x / scale, p.y / scale, 18, 18, 0, '#79797994', 6);
    }
}

function tick(now) {
    accumulated_time += now - last_time;
    last_time = now;
    while (accumulated_time >= ms_per_tick) {
        game_update();
        accumulated_time -= ms_per_tick;
    }
    game_render();
    requestAnimationFrame(tick);
}

game_setup();
requestAnimationFrame(tick);