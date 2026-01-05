const canvas = document.getElementById('boids_canvas');
const ctx = canvas.getContext("2d");
const heightRatio = 9/16;
canvas.height = canvas.width * heightRatio;

// utility function for random positions
// random integer from a range INCLUDING min and max
function rand_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const boids_num = 50;
const boids_size = 10;

const spawn_margin_percent = 0.15;
const x_min = canvas.width*spawn_margin_percent;
const x_max = canvas.width*(1 - spawn_margin_percent);
const y_min = canvas.height*spawn_margin_percent;
const y_max = canvas.height*(1 - spawn_margin_percent);

const min_vel = 1;
const max_vel = 1;

// slider values
let cohesion_factor = 2;
let alignment_factor = 2;
let separation_distance = 20;
let visual_range = 90;

// hidden (for now) tunable values
let turn_factor = 1;
let separation_factor = 2;

// because why not
class Vec2D {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
}

function vec_add(...vecs) {
  v = new Vec2D();
  for (let vec of vecs) {
    v.x += vec.x;
    v.y += vec.y;
  }
  return v;
}

function vec_subtract(v1, v2) {
  return new Vec2D(v1.x - v2.x, v1.y - v2.y);
}

function vec_mult_scalar(v1, n) {
  return new Vec2D(v1.x * n, v1.y * n);
}

function vec_div_scalar(v1, n) {
  return new Vec2D(v1.x / n, v1.y / n);
}

function vec_distance(v1, v2) {
  return Math.sqrt((v2.x - v1.x)**2 + (v2.y - v1.y)**2);
}

class Boid {
    constructor(x, y, vx, vy) {
        this.position = new Vec2D(x, y);
        this.velocity = new Vec2D(vx, vy);
    }
}

let boids_arr = [];

function create_boids() {
  for (let i = 0; i <= boids_num; i++) {
    let spawn_x = rand_int(x_min, x_max);
    let spawn_y = rand_int(y_min, y_max);
  
    b = new Boid(spawn_x, spawn_y, 0, 0);
    boids_arr.push(b);
  }
}

// based on https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html
function boids_logic() {
  boids_arr.forEach((boid) => {
    // accumulator variables
    let pos_avg = new Vec2D(), vel_avg = new Vec2D(), close_vec = new Vec2D();
    let neighbors_count = 0;
    // used to calculate magnitude
    const zero_vec = new Vec2D(0, 0);

    // detecting other boids
    const other_boids = boids_arr.filter((b) => b !== boid);
    other_boids.forEach((other_boid) => {
      dx = boid.x - other_boid.x;
      dy = boid.y - other_boid.y;
      
      let dist = vec_distance(other_boid.position, boid.position);
      // if ((Math.abs(dx) < visual_range) && (Math.bs(dy) < visual_range)) {
      if (dist <= visual_range) {
        // equivalent to rule 2 (separation) in the old code
        if (dist < separation_distance) {
          close_vec = vec_subtract(close_vec, vec_subtract(other_boid.position, boid.position));
        } else {
          pos_avg = vec_add(pos_avg, other_boid.position);
          vel_avg = vec_add(vel_avg, other_boid.velocity);
          neighbors_count += 1;
        }
      }
    });
    
    // equivalent to rule 1 (cohesion) and rule 3 (alignment) in old code
    // boids match the average posiiton and velocity of the other boids they see
    if (neighbors_count > 0) {
      pos_avg = vec_div_scalar(pos_avg, neighbors_count);
      vel_avg = vec_div_scalar(vel_avg, neighbors_count);
      let cohesion_vector = vec_mult_scalar(vec_subtract(pos_avg, boid.position), cohesion_factor);
      let alignment_vector = vel_move = vec_mult_scalar(vec_subtract(vel_avg, boid.velocity), alignment_factor); 

      // add cohesion and alignment
      boid.velocity = vec_add(boid.velocity, cohesion_vector, alignment_vector);
    }

    // implementing separation
    let separation_vector = vec_mult_scalar(close_vec, separation_factor);

    // add separtion and edge turning
    boid.velocity = vec_add(boid.velocity, separation_vector);

    if (boid.position.x < x_min) {boid.velocity.x = max_vel*turn_factor;}
    else if (boid.position.x > x_max) {boid.velocity.x = -1*max_vel*turn_factor;}

    if (boid.position.y < y_min) {boid.velocity.y = max_vel*turn_factor;}
    else if (boid.position.y > y_max) {boid.velocity.y = -1*max_vel*turn_factor;}    

    // limit speed
    speed = vec_distance(boid.velocity, zero_vec);
    if (speed < min_vel) {
     boid.velocity = vec_mult_scalar(vec_div_scalar(boid.velocity, speed), min_vel);
    }
    if (speed > max_vel) {
      boid.velocity = vec_mult_scalar(vec_div_scalar(boid.velocity, speed), max_vel);
    }

    // update position based on total velocity
    boid.position = vec_add(boid.position, boid.velocity);
  });
}

function render() {
  boids_arr.forEach((boid) => {
    ctx.fillStyle = "dodgerblue";
    ctx.beginPath();
    ctx.arc(boid.position.x, boid.position.y, boids_size, 0, 2*Math.PI, true);
    ctx.fill();

    ctx.strokeStyle = "rgb(0 0 0 / 20%)";
    ctx.beginPath();
    ctx.arc(boid.position.x, boid.position.y, visual_range, 0, 2*Math.PI, true);
    // ctx.stroke();
    ctx.arc(boid.position.x, boid.position.y, separation_distance, 0, 2*Math.PI, true);
    ctx.stroke();
    // console.log(`Drew a boid at (${boid.x}, ${boid.y})`);
  });
}

function init() { 
  create_boids();
  window.requestAnimationFrame(draw_loop);
}

function draw_loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  boids_logic();
  render();
  window.requestAnimationFrame(draw_loop);
}

init();
