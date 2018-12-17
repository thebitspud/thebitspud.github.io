// setting up canvas
const screen = $('#main-screen');
const ctx = screen[0].getContext("2d");

const titleList = ["Watch Balls Move", "Spectate Sphere Physics", "Ningen Bounce", "Wall Tennis", "Gravity Balls", "Zero-Player Pong", "Lag Physics", "Observe Circle Collisions", "JavaScript is fun!", "Stored in the Balls", "Certified Useless Website"];

var balls = [];

//statistics
var totalSpawns = 0,
    currentBalls = 0,
    activeBalls = 0,
    inertBalls = 0,
    removedBalls = 0,
    maxBalls = 100;

// program data
const screenSize = 500,
    defaultRadius = 10,
    gravity = 0.4,
    friction = 0.90;

// viewer options
let gravityOn = false,
    autospawnOn = true,
    autoclearOn = true;

// ball spawning loop
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
async function autospawn() {
    // capping the ball count
    if((balls.length < maxBalls) && autospawnOn) createBall();

    // automatically clearing balls as they spawn
    if(autoclearOn) autoclear();

    await sleep(1000); // 1.000 second delay between spawns
    autospawn();
}

//adds a ball to the canvas
function createBall() {
    // randomly generated starting positons and velocities
    var direction = Math.floor(Math.random() * 16), dx, dy, x, y;

    switch(direction) {
        case 0: dx = 2; dy = 2; break;
        case 1: dx = 2; dy = -2; break;
        case 2: dx = -2; dy = 2; break;
        case 3: dx = -2; dy = -2; break;
        case 4: dx = 2.83; dy = 0; break;
        case 5: dx = -2.83; dy = 0; break;
        case 6: dx = 0; dy = 2.83; break;
        case 7: dx = 0; dy = -2.83; break;
        case 8: dx = 1.17; dy = 2.57; break;
        case 9: dx = 1.17; dy = -2.57; break;
        case 10: dx = -1.17; dy = 2.57; break;
        case 11: dx = -1.17; dy = -2.57; break;
        case 12: dx = 2.57; dy = 1.17; break;
        case 13: dx = 2.57; dy = -1.17; break;
        case 14: dx = -2.57; dy = 1.17; break;
        case 15: dx = -2.57; dy = -1.17; break;
    }

    x = Math.random() * (screenSize - (defaultRadius * 2));
    if(gravityOn) y = Math.random() * ((screenSize / 2) - defaultRadius);
    else y = Math.random() * (screenSize - (defaultRadius * 2)); // y-position

    balls.push(new Ball(x, y, dx, dy, defaultRadius));
    totalSpawns++;
}

//automatically clearing inert balls
function autoclear() {
    for(i = 0; i < balls.length; i++) {
        if(balls[i].dx == 0 && balls[i].dy == 0) {
            balls.splice(i, 1);
            removedBalls++;
        }
    }

    for(i = currentBalls; i > maxBalls; i--) {
        balls.shift();
        removedBalls++;
    }
}

//updating stats with each spawn rotation
async function updateStats() {
    currentBalls = 0;
    inertBalls = 0;
    activeBalls = 0;

    for(i = 0; i < balls.length; i++) {
        currentBalls++;

        if(balls[i].dx == 0 && balls[i].dy == 0) inertBalls++;
        else activeBalls++;
    }

    $("#total-spawns").html(totalSpawns);
    $("#max-balls").html(maxBalls);
    $("#current-balls").html(currentBalls);
    $("#active-balls").html(activeBalls);
    $("#inert-balls").html(inertBalls);
    $("#removed-balls").html(removedBalls);

    await sleep(100); // refreshes once every 0.1 seconds
    updateStats();
}

// starting the spawn and animation loops once the document is loaded
$(document).ready(function() {
    autospawn();
    updateStats();
    animate();

    // setting the title heading to one ramdomly chosen from a preset
    $("#title-text").html(titleList[Math.floor(Math.random() * titleList.length)]);
});

// accessible Ball object
function Ball(x, y, dx, dy, radius) {
    this.x = x + radius;
    this.y = y + radius;
    this.dx = dx; 
    this.dy = dy;
    this.radius = radius;

    // rendering the ball
    this.render = function() {
        var fillColor;
        if(this.dx == 0 && this.dy == 0) fillColor = "#DD8888"
        else fillColor = "#BBBBBB";

        screen.drawArc({
            fillStyle: fillColor,
            strokeStyle: "#FFFFFF",
            strokeWidth: 2,
            x: this.x,
            y: this.y,
            radius: this.radius
        });
    }

    // applying the pseudo-physics to the canvas
    this.calculateGravity = function() {
        // gravity will not apply if the ball is at the bootom of the canvas
        if(this.y < screenSize - defaultRadius) this.dy += gravity;
        // if the absolute y-velocity of the ball is low enough, it will stop moving (prevents jitter)
        else if(this.dy <= 0.2 && this.dy >= -0.2) {
            this.dy = 0;
            if(this.y < screenSize - defaultRadius) this.y += 0.5; // easing the ball into the bottom of the canvas

            if(this.dx != 0) this.dx *= 0.995;
        }

        // stops moving if the absolute x-velocity of the ball is low enough        
        if(this.dx <= 0.05 && this.dx >= -0.05) {
            this.dx = 0;

            if(this.y >= screenSize - 12 && this.dy <= gravity && this.dy >= -gravity) this.dy = 0; // cleaning up jittery objects
        }

        // wall collisions (apply friction)
        if((this.x - this.radius) <= 0 && this.dx < 0) {
            this.dx *= -friction;
            this.dy *= friction;
        } // top

        if((this.x + this.radius) >= screenSize && this.dx > 0) {
            this.dx *= -friction;
            this.dy *= friction;
        } // bottom

        if((this.y - this.radius) <= 0 && this.dy < 0) {
            this.dy *= -friction;
            this.dx *= friction;
        } // left

        if((this.y + this.radius) >= screenSize && this.dy > 0) {
            this.dy *= -friction;
            this.dx *= friction;
        } // right
    }

    // movement and collisions
    this.tick = function() {
        if(gravityOn) this.calculateGravity();
        else{
            if((this.x + this.radius) >= screenSize || (this.x - this.radius) <= 0) this.dx = -this.dx;
            if((this.y + this.radius) >= screenSize || (this.y - this.radius) <= 0) this.dy = -this.dy;
        }

        // applying velocity to ball position
        this.x += this.dx; this.y += this.dy;
    }
}

function toggleGravity() {
    if(gravityOn) {
        gravityOn = false;
        $("#gravity-toggle").html("Gravity: OFF");
    }else{
        gravityOn = true;
        $("#gravity-toggle").html("Gravity: ON");
    }
}

function toggleAutospawn() {
    if(autospawnOn) {
        autospawnOn = false;
        $("#autospawn-toggle").html("Autospawn: OFF");
    }else{
        autospawnOn = true;
        $("#autospawn-toggle").html("Autospawn: ON");
    }
}

function toggleAutoclear() {
    if(autoclearOn) {
        $("#autoclear-toggle").html("Autoclear: OFF");
        autoclearOn = false;
    }else{
        $("#autoclear-toggle").html("Autoclear: ON");
        autoclearOn = true;
    }
}

function centerBalls() {
    for(i = 0; i < balls.length; i++) {
        balls[i].x = Math.random() * 100 + (screenSize / 2) - 50;
        balls[i].y = Math.random() * 100 + (screenSize / 2) - 50;
    }
}

function randomBalls() {
    var spawnRegion = screenSize - (defaultRadius * 2);

    for(i = 0; i < balls.length; i++) {
        balls[i].x = (Math.random() * spawnRegion) + defaultRadius;
        balls[i].y = (Math.random() * spawnRegion) + defaultRadius;
    }
}

// span a ring of 16 balls
function spawnRing() {
    var dx = [2, 2, -2, -2, 2.83, -2.83, 0, 0, 1.17, 1.17, -1.17, -1.17, 2.57, 2.57, -2.57, -2.57],
        dy = [2, -2, 2, -2, 0, 0, 2.83, -2.83, 2.57, -2.57, 2.57, -2.57, 1.17, -1.17, 1.17, -1.17];

    for(i = 0; i < 16; i++) {
        balls.push(new Ball((screenSize / 2) - defaultRadius, (screenSize / 2) - defaultRadius, dx[i], dy[i], defaultRadius));
    }

    totalSpawns += 16;
}

// runs a loop that draws and updates the canvas objects
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, 500, 500);

    for(i = 0; i < balls.length; i++) {
        balls[i].tick();
        balls[i].render();
    }
}